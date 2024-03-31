import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/clientv2';

import { PrismaServiceV2 } from '../prisma/prismav2.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaServiceV2) {}

  async findOne(uniqueAttr: Prisma.UserWhereUniqueInput) {
    return await this.prisma.user.findUnique({ where: uniqueAttr });
  }

  async create(data: Prisma.UserCreateInput) {
    return await this.prisma.user.create({ data });
  }
}
