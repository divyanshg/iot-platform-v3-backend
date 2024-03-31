import { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginatedQuery } from '../types';
import { OutputData, transformData } from '../utils/lib';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() createRoomDto: CreateRoomDto, @Req() { user }: Request) {
    try {
      const createdRoom = await this.roomService.create({
        ...createRoomDto,
        ownerId: user.userId,
      });
      return {
        code: 201,
        message: 'Room created successfully',
        data: createdRoom,
      };
    } catch (e) {
      return {
        code: 500,
        message: e.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-many')
  async createMany(
    @Body('rooms') createRoomsDto: CreateRoomDto[],
    @Req() { user }: Request,
  ) {
    try {
      const roomsToCreate = createRoomsDto.map((createRoomDto) => ({
        ...createRoomDto,
        ownerId: user.userId,
      }));
      await this.roomService.createMany(roomsToCreate);
      return {
        code: 201,
        message: 'Rooms created successfully',
        data: null,
      };
    } catch (e) {
      console.log(e);
      return {
        code: 500,
        message: e.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAll(@Req() { user }: Request, @Query() q: PaginatedQuery) {
    try {
      const skip = Number(q.page * q.limit - q.limit);
      const take = Number(q.limit);
      const rooms = await this.roomService.findAll(user.userId, { skip, take });
      return {
        code: 200,
        ...rooms,
      };
    } catch (err) {
      return {
        code: 500,
        message: err.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('read/:id')
  async findOne(
    @Param('id') id: string,
    @Req() { user }: Request,
  ): Promise<{
    code: number;
    message: string;
    data?: OutputData;
  }> {
    // Use OutputData as the return type
    try {
      const room = await this.roomService.findOne(id, user.userId);
      if (!room) {
        return {
          code: 404,
          message: 'Room not found',
        };
      }

      const result = await transformData(room as never);

      return {
        code: 200,
        message: 'Room found',
        data: result,
      };
    } catch (err) {
      return {
        code: 500,
        message: err.message,
      };
    }
  }

  // @Get('update/:id')
  // async update(@Param('id') id: string, @Query() query: UpdateRoomDto) {
  //   try {
  //     await this.roomService.update(id, query);

  //     return {
  //       code: 200,
  //       message: 'Room updated successfully',
  //     };
  //   } catch (err) {
  //     return {
  //       code: 500,
  //       message: err.message,
  //     };
  //   }
  // }

  @Delete('/delete/:id')
  async remove(@Param('id') id: string) {
    return this.roomService.remove(id);
  }
}
