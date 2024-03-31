import { Injectable } from '@nestjs/common';

import { PrismaServiceV2 } from '../prisma/prismav2.service';
import ApiResponse from '../Response';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaServiceV2) {}

  async create(createOrganizationDto: CreateOrganizationDto, user_id: string) {
    //check if user already has an organization
    const userOrg = await this.prisma.organization.findFirst({
      where: {
        users: {
          some: {
            id: user_id,
          },
        },
      },
    });

    if (userOrg) {
      return {
        status: 400,
        message: 'User already has an organization',
        data: null,
      };
    }

    const newOrg = await this.prisma.organization.create({
      data: {
        name: createOrganizationDto.name,
        description: createOrganizationDto.description,
        users: {
          connect: {
            id: user_id,
          },
        },
      },
    });

    return {
      status: 201,
      message: 'Organization created successfully',
      data: newOrg.id,
    };
  }

  async findAll(user_id: string) {
    return await this.prisma.organization.findMany({
      where: {
        users: {
          some: {
            id: user_id,
          },
        },
      },
    });
  }

  async findOne(id: string, user_id: string) {
    return await this.prisma.organization.findFirst({
      where: {
        id,
        users: {
          some: {
            id: user_id,
          },
        },
      },
      include: {
        devices: {
          select: {
            id: true,
            name: true,
            description: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        policies: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        certificates: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
  }

  update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    return `This action updates a #${id} organization`;
  }

  remove(id: number) {
    return `This action removes a #${id} organization`;
  }
}
