import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/clientv2';

import { PrismaServiceV2 } from '../prisma/prismav2.service';
import { CreateGroupDto, CreateSubgrpDTO } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaServiceV2) {}

  async create(createGroupDto: CreateGroupDto, user_id: string) {
    const newGroup = await this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        ...(createGroupDto.description && {
          description: createGroupDto.description,
        }),
        User: {
          connect: {
            id: user_id,
          },
        },
      },
    });

    return newGroup.id;
  }

  async createSubgrp(subGroup: CreateSubgrpDTO) {
    const subGrp = await this.prisma.subGroup.create({
      data: {
        name: subGroup.name,
        description: subGroup.description,

        Group: {
          connect: {
            id: subGroup.groupId,
          },
        },
      },
    });

    return subGrp.id;
  }

  async findAll(userId: string) {
    return await this.prisma.group.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        // Attach the count of subgroups
        subGroups: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  async findAllSubGrp(groupId: string) {
    return await this.prisma.subGroup.findMany({
      where: {
        groupId,
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.group.findUnique({
      where: {
        id,
      },
    });
  }

  async findOneSubGrp(id: string) {
    return await this.prisma.subGroup.findUnique({
      where: {
        id,
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

  async update(id: string, updateGroupDto: Prisma.GroupUpdateInput) {
    return await this.prisma.group.update({
      where: {
        id,
      },
      data: updateGroupDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.group.delete({
      where: {
        id,
      },
    });
  }

  async removeSubGrp(id: string) {
    return await this.prisma.subGroup.delete({
      where: {
        id,
      },
    });
  }
}
