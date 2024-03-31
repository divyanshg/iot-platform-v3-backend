import { redisStore } from 'cache-manager-redis-store';
import * as fs from 'fs';

import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

import { AuthModule } from './auth/auth.module';
import { CertificatesModule } from './certificates/certificates.module';
import { DevicesModule } from './devices/devices.module';
import { GatewayModule } from './gateway/gateway.module';
import { GroupsModule } from './groups/groups.module';
import { MediaServerModule } from './media-server/media-server.module';
import { MqttBrokerModule } from './mqtt-broker/mqtt-broker.module';
import { OrganizationModule } from './organization/organization.module';
import { PigeonModule } from './pigeon';
import { PoliciesModule } from './policies/policies.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoomModule } from './room/room.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        store: (await redisStore({
          url: config.get<string>('REDIS_HOSTNAME'),
          password: config.get<string>('REDIS_PASSWORD'),
        })) as unknown as CacheStore,
        ttl: 5,
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
    MediaServerModule,
    PigeonModule.forRoot({
      port: Number(process.env.MQTT_PORT),
      transport: Transport.TCP as never,
      id: process.env.BROKER_ID,
      concurrency: Number(process.env.BROKER_CONCURRENCY),
      queueLimit: Number(process.env.BROKER_QUEUE_LIMIT),
      maxClientsIdLength: 42,
      connectTimeout: Number(process.env.BROKER_CONNECTION_TIMEOUT),
      heartbeatInterval: Number(process.env.BROKER_HEARTBEAT_INTERVAL),
      key: fs.readFileSync(process.env.BROKER_KEY),
      cert: fs.readFileSync(process.env.BROKER_CERT),
      ca: fs.readFileSync(process.env.CA_CERT_PATH),
      rejectUnauthorized: Boolean(process.env.BROKER_REJECT_UNAUTHORIZED),
      requestCert: Boolean(process.env.BROKER_REQUEST_CERT),
    }),
    RoomModule,
    PrismaModule,
    GatewayModule,
    UserModule,
    AuthModule,
    MqttBrokerModule,
    OrganizationModule,
    CertificatesModule,
    GroupsModule,
    PoliciesModule,
    DevicesModule,
  ],
})
export class AppModule {}
