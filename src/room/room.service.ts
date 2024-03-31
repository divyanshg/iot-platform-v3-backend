import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}
  async create(createRoomDto: CreateRoomDto) {
    const newRoom = await this.prisma.room.create({
      data: {
        name: createRoomDto.name,
        ownerId: createRoomDto.ownerId,
        properties: {
          create: {
            name: 'occupants',
          },
        },
      },
    });

    await this.prisma.user.update({
      where: {
        id: createRoomDto.ownerId,
      },
      data: {
        room_count: {
          increment: 1,
        },
      },
    });

    return newRoom;
  }

  async createMany(createRoomsDto: CreateRoomDto[]) {
    const newRooms = [];
    for (const createRoomDto of createRoomsDto) {
      const newRoom = await this.prisma.room.create({
        data: {
          name: createRoomDto.name,
          ownerId: createRoomDto.ownerId,
          properties: {
            create: {
              name: 'occupants',
            },
          },
        },
      });
      newRooms.push(newRoom);
    }

    await this.prisma.user.update({
      where: {
        id: createRoomsDto[0].ownerId,
      },
      data: {
        room_count: {
          increment: createRoomsDto.length,
        },
      },
    });

    return newRooms;
  }

  async findAll(ownerId: string, params: { skip?: number; take?: number }) {
    const rooms = await this.prisma.room.findMany({
      ...params,
      where: {
        ownerId,
      },
    });

    const { room_count } = await this.prisma.user.findUnique({
      where: {
        id: ownerId,
      },
      select: {
        room_count: true,
      },
    });

    const total_pages = Math.ceil(room_count / (params.take || 10));

    return {
      total_pages,
      page: Math.ceil(params.skip / params.take) + 1,
      per_page: params.take,
      total: room_count,
      data: rooms,
    };
  }

  async findOne(id: string, ownerId: string) {
    return await this.prisma.room.findUnique({
      where: {
        id,
        ownerId,
      },
      include: {
        properties: {
          include: {
            values: true,
          },
        },
      },
    });
  }

  async findByKey(apiKey: string, room_id: string) {
    return await this.prisma.room.findUnique({
      where: {
        owner: {
          apiKey,
        },
        id: room_id,
      },
    });
  }

  // async update(id: string, updateRoomDto: UpdateRoomDto) {
  //   return await this.prisma.room.update({
  //     where: {
  //       id,
  //     },
  //     data: {
  //       topics: updateRoomDto.occupants,
  //     },
  //   });
  // }

  async remove(id: string) {
    await this.prisma.user.update({
      where: {
        id: id,
      },
      data: {
        room_count: {
          decrement: 1,
        },
      },
    });
    return await this.prisma.room.delete({
      where: {
        id,
      },
    });
  }
}
