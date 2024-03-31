import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/clientv2';

@Injectable()
export class PrismaServiceV2 extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
