import { Cache } from 'cache-manager';
import { generateSlug } from 'random-word-slugs';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';

import { CertificatesService } from '../certificates/certificates.service';
import { DevicesService } from '../devices/devices.service';
import { GatewayProvider } from '../gateway/gateway.provider';
import {
  Client,
  Credential,
  Function,
  onAck,
  onAuthenticate,
  onAuthorizePublish,
  onAuthorizeSubscribe,
  onClient,
  onClientDisconnect,
  onPreConnect,
  onPublish,
  Packet,
  PigeonService,
  Subscription,
  Topic,
} from '../pigeon';
import { PrismaServiceV2 } from '../prisma/prismav2.service';
import { checkMqttTopic } from '../utils/lib';

class CustomError extends Error {
  returnCode: number;
}

function removeIPv6Prefix(ipAddress) {
  if (ipAddress.startsWith('::ffff:')) {
    return ipAddress.slice(7); // Remove the first 7 characters (::ffff:)
  } else {
    return ipAddress; // Return the original address if it doesn't start with ::ffff:
  }
}

function getClaimId(clientId: string): string {
  return clientId.split('_')[0] + '_' + clientId.split('_')[1];
}

@Injectable()
export class MqttBrokerService {
  constructor(
    @Inject(PigeonService) private readonly aedesService: PigeonService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
    private prisma: PrismaServiceV2,
    private deviceService: DevicesService,
    private certService: CertificatesService,
    private readonly gateway: GatewayProvider,
  ) {}

  @onAck()
  onAck(@Client() client, @Packet() packet) {
    console.log('Function: @onAck()');
  }

  @onClient()
  onClient(@Client() client) {
    console.log('Function: @onClient()');
  }

  @onAuthenticate()
  async onAuthenticate(@Client() client, @Function() done) {
    const deviceId = client.id.toString();
    const claimId = deviceId.startsWith('claim')
      ? getClaimId(deviceId)
      : deviceId;

    console.log(
      deviceId,
      removeIPv6Prefix(client.conn.remoteAddress),
      'connecting',
    );
    // get device certificate data
    const certData = await this.cacheService.get<{
      cn: string;
      ou: string;
      o: string;
    }>(claimId);

    if (!certData) {
      return done(new UnauthorizedException());
    }
    //client id comes in format : claim_<cert_id>_<random_string>
    // compare only the claim_<cert_id> part
    if (claimId.split('_')[1] != certData.cn.split('_')[1]) {
      const err = new CustomError('Invalid certificate');
      err.returnCode = 2;
      return done(err, false);
    }

    if (client.id.split('_')[0] == 'claim') {
      //check if a claim certificate exists
      const claimCertificate = await this.prisma.certificates.findUnique({
        where: {
          organizationId: certData.o,
          // policyId: certData.ou,
          id: certData.cn.split('_')[1],
          status: 'ACTIVE',
          type: 'CLAIM',
        },
      });

      if (!claimCertificate) {
        const err = new CustomError('Invalid Claim certificate');
        err.returnCode = 3;
        return done(err, false);
      }

      return done(null, true);
    }

    const device = await this.prisma.device.findUnique({
      where: {
        id: deviceId,
        policyId: certData.ou,
        organizationId: certData.o,
      },
      include: {
        policy: {
          select: {
            allowConnect: true,
          },
        },
      },
    });

    if (!device) {
      const err = new CustomError('Device not registered');
      err.returnCode = 4;
      return done(err, false);
    }

    if (!device.policy.allowConnect) {
      const err = new CustomError('Connection not allowed by policy');
      err.returnCode = 5;
      return done(err, false);
    }

    console.log(
      device.name,
      removeIPv6Prefix(client.conn.remoteAddress),
      'connected',
    );

    //update device status
    await this.prisma.device.update({
      where: {
        id: device.id,
        policyId: device.policyId,
        organizationId: device.organizationId,
      },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    if (client.id.split('_')[0] != 'claim') {
      await this.cacheService.del(client.id.toString());
    }
    return done(null, true);
  }

  @onAuthorizePublish()
  async onAuthorizePublish(
    @Client() client,
    @Packet() packet,
    @Function() done,
  ) {
    if (packet.topic.startsWith('$SYS')) return;

    if (!client.id) {
      return done(new Error('Client not authorized to publish to this topic'));
    }
    if (
      packet.topic.startsWith('$CLAIM') ||
      client.id.split('_')[0] == 'claim' ||
      packet.topic.split('/')[1] == client.id
    ) {
      //get certificate data from cache
      const claimId = getClaimId(client.id);
      const certData = await this.cacheService.get<{
        cn: string;
        ou: string;
        o: string;
      }>(claimId);
      //create a new device
      const device_name = generateSlug(2);

      //create certificate for the new device
      const certificateId = await this.certService.create(
        certData.o,
        certData.ou,
        'NORMAL',
      );

      const provisionedDevice: {
        id: string;
        key: string;
      } = (await this.deviceService.create(
        {
          name: device_name,
          description: 'Auto provisioned device',
          policyId: certData.ou,
          certificateId,
        },
        certData.o,
        true,
      )) as {
        id: string;
        key: string;
      };

      //generating cert files and signing them
      await this.certService.generatePrivateKeyAndCSR(
        device_name,
        provisionedDevice.id,
        certData.o,
        certData.ou,
        provisionedDevice.key,
        certificateId,
      );

      this.aedesService.publish({
        cmd: 'publish',
        dup: false,
        retain: false,
        topic: `$CLAIM_PROVISION/${client.id}`,
        qos: 1,
        payload: JSON.stringify({
          status: 'provisioned',
          clientId: provisionedDevice.id,
          certs: this.certService.getFilesInString(certificateId, device_name),
        }),
      });
      return done(null, packet);
    }

    const device = await this.prisma.device.findUnique({
      where: {
        id: client.id,
      },
      include: {
        organization: {
          select: {
            id: true,
          },
        },
        policy: {
          select: {
            publishTopics: true,
          },
        },
      },
    });

    if (!device) {
      return done(new Error('Device not found'));
    }

    const rawTopic = packet.topic;

    packet.topic = `${device.organization.id}/${rawTopic}`;

    const isAuthorized = device.policy.publishTopics.some((pattern) =>
      checkMqttTopic(pattern, packet.topic),
    );
    if (!isAuthorized) {
      const err = new CustomError('Not authorized to publish to this topic');
      err.returnCode = 5;
      return done(err);
    }

    //send to socket
    const payloadInString = packet.payload.toString();
    this.gateway.server.to(device.organizationId).emit('data', {
      topic: rawTopic,
      payload: {
        time: new Date().toISOString(),
        ...JSON.parse(payloadInString),
      },
    });

    return done(null);
  }

  @onAuthorizeSubscribe()
  async onAuthorizeSubscribe(
    @Client() client,
    @Subscription() subscription,
    @Function() done,
  ) {
    if (subscription.topic.startsWith('$SYS')) return;

    if (
      subscription.topic.startsWith('$CLAIM_PROVISION') ||
      (client.id.split('_')[0] == 'claim' &&
        subscription.topic.split('/')[1] == client.id)
    ) {
      return done(null, subscription);
    }

    const device = await this.prisma.device.findUnique({
      where: {
        id: client.id,
      },
      include: {
        organization: {
          select: {
            id: true,
          },
        },
        policy: {
          select: {
            subscribeTopics: true,
          },
        },
      },
    });

    if (!device) {
      return done(new Error('Device not found'));
    }

    subscription.topic = `${device.organization.id}/${subscription.topic}`;

    const isAuthorized = device.policy.subscribeTopics.some((pattern) =>
      checkMqttTopic(pattern, subscription.topic),
    );
    if (!isAuthorized) {
      console.log('here');
      return done(new Error('Not authorized to subscribe to this topic'));
    }

    return done(null, subscription);
  }

  @onPublish()
  async OnPublish(
    @Packet()
    { topic, payload }: { topic: typeof Topic; payload: typeof Payload },
    @Client() client,
  ) {
    if (
      topic.toString().startsWith('$SYS') ||
      topic.toString().startsWith('$CLAIM') ||
      client.id.split('_')[0] == 'claim'
    )
      return;

    //update HistoricalValue
    await this.prisma.historicalValue.create({
      data: {
        topic: topic.toString(),
        payload: payload.toString(),
        device: {
          connect: {
            id: client.id,
          },
        },
      },
    });
  }

  @onClientDisconnect()
  async OnClientDisconnect(@Client() client) {
    if (client.id.split('_')[0] == 'claim') return;
    await this.prisma.device.update({
      where: {
        id: client.id,
      },
      data: {
        lastSeen: new Date(),
        isOnline: false,
      },
    });
  }
}
