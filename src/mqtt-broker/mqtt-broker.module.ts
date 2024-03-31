import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CertificatesModule } from '../certificates/certificates.module';
import { DevicesModule } from '../devices/devices.module';
import { GatewayModule } from '../gateway/gateway.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MqttBrokerService } from './mqtt-broker.service';
import { MqttController } from './mqtt.controller';

@Module({
  imports: [PrismaModule, DevicesModule, CertificatesModule, GatewayModule],
  providers: [MqttBrokerService],
  controllers: [MqttController],
})
export class MqttBrokerModule {}
