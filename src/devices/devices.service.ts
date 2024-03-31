import { Injectable } from '@nestjs/common';

import { PrismaServiceV2 } from '../prisma/prismav2.service';
import { generateApiKey } from '../utils/lib';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaServiceV2) {}

  async create(
    createDeviceDto: CreateDeviceDto,
    org_id: string,
    returnKey?: boolean,
  ) {
    const key = generateApiKey(
      `${org_id}:${createDeviceDto.policyId}:${createDeviceDto.name}`,
    );
    const newDevice = await this.prisma.device.create({
      data: {
        organization: {
          connect: {
            id: org_id,
          },
        },
        name: createDeviceDto.name,
        description: createDeviceDto.description,
        ...(createDeviceDto.subGroupId && {
          subGroup: {
            connect: {
              id: createDeviceDto.subGroupId,
            },
          },
        }),
        policy: {
          connect: {
            id: createDeviceDto.policyId,
          },
        },
        ...(createDeviceDto.certificateId && {
          certificate: {
            connect: {
              id: createDeviceDto.certificateId,
            },
          },
        }),
        key,
      },
    });

    if (returnKey)
      return {
        id: newDevice.id,
        key,
      };
    else return newDevice.id;
  }

  async findAll(org_id: string) {
    return await this.prisma.device.findMany({
      where: {
        organizationId: org_id,
      },
    });
  }

  async findOne(id: string, org_id: string) {
    return await this.prisma.device.findUnique({
      where: {
        id,
        organizationId: org_id,
      },
    });
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto, org_id: string) {
    return await this.prisma.device.update({
      where: {
        id,
        organizationId: org_id,
      },
      data: {
        name: updateDeviceDto.name,
        description: updateDeviceDto.description,
        subGroup: {
          connect: {
            id: updateDeviceDto.subGroupId,
          },
        },
        policy: {
          connect: {
            id: updateDeviceDto.policyId,
          },
        },
        certificate: {
          connect: {
            id: updateDeviceDto.certificateId,
          },
        },
      },
    });
  }

  async remove(id: string, org_id: string) {
    return await this.prisma.device.delete({
      where: {
        id,
        organizationId: org_id,
      },
    });
  }
}
