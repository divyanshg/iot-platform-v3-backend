import { Injectable } from '@nestjs/common';

import { GatewayProvider } from '../gateway/gateway.provider';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertyService {
  constructor(
    private prisma: PrismaService,
    private readonly gateway: GatewayProvider,
  ) {}

  async create(property: CreatePropertyDto & { room_id: string }) {
    return await this.prisma.property.create({
      data: {
        name: property.name,
        roomId: property.room_id,
      },
    });
  }

  async findAll(roomId: string) {
    return await this.prisma.property.findMany({
      where: {
        roomId,
      },
      include: {
        //only the last value
        values: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });
  }

  async propertyExists(roomId: string, name: string) {
    return await this.prisma.property.findMany({
      where: {
        roomId,
        name,
      },
    });
  }

  async update(roomId: string, name: string, value: string) {
    this.gateway.server.to(roomId).emit('data', {
      time: new Date().toISOString(),
      [name]: value,
    });

    const property = await this.prisma.property.findMany({
      where: {
        roomId,
        name,
      },
    });

    return await this.prisma.property.update({
      where: {
        roomId,
        id: property[0].id,
      },
      data: {
        values: {
          create: {
            value,
          },
        },
      },
    });
  }
}
