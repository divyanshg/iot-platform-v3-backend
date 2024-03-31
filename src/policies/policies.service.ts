import { Injectable } from '@nestjs/common';

import { PrismaServiceV2 } from '../prisma/prismav2.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaServiceV2) {}
  async create(createPolicyDto: CreatePolicyDto, org_id: string) {
    return await this.prisma.devicePolicy.create({
      data: {
        name: createPolicyDto.name,
        description: createPolicyDto.description,
        devices: {
          connect: createPolicyDto.devices.map((device) => ({
            id: device,
          })),
        },
        allowConnect: createPolicyDto.allowConnect,
        publishTopics: createPolicyDto.publishTopics,
        subscribeTopics: createPolicyDto.subscribeTopics,
        organization: {
          connect: {
            id: org_id,
          },
        },
      },
    });
  }

  async findAll(org_id: string) {
    return await this.prisma.devicePolicy.findMany({
      where: {
        organizationId: org_id,
      },
    });
  }

  async findOne(id: string, org_id: string) {
    return await this.prisma.devicePolicy.findUnique({
      where: {
        id: id,
        organizationId: org_id,
      },
      include: {
        devices: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            lastSeen: true,
            isOnline: true,
          },
        },
      },
    });
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto, org_id: string) {
    return `This action updates a #${id} policy`;
  }

  async remove(id: string, org_id: string) {
    return await this.prisma.devicePolicy.delete({
      where: {
        id: id,
        organizationId: org_id,
      },
    });
  }
}
