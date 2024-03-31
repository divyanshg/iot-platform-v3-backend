import { Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';
import { PrismaServiceV2 } from './prismav2.service';

@Module({
  providers: [PrismaService, PrismaServiceV2],
  exports: [PrismaService, PrismaServiceV2],
})
export class PrismaModule {}
