import { Module } from '@nestjs/common';

import { GatewayModule } from '../gateway/gateway.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';

@Module({
  imports: [PrismaModule, GatewayModule],
  controllers: [RoomController, PropertyController],
  providers: [RoomService, PropertyService],
})
export class RoomModule {}
