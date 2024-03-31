import { Request } from 'express';

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import ApiResponse from '../Response';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyService } from './property.service';
import { RoomService } from './room.service';

@Controller('rooms/:room_id/property')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly roomService: RoomService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Param('room_id') room_id: string,
    @Req() { user }: Request,
  ) {
    try {
      const room = await this.roomService.findOne(room_id, user.userId);

      if (!room) {
        return new ApiResponse(401, 'Room not found', null);
      }

      //check if the property already exists
      const propertyExists = await this.propertyService.propertyExists(
        room_id,
        createPropertyDto.name,
      );

      if (propertyExists.length > 0) {
        return new ApiResponse(400, 'Property already exists', null);
      }

      const createdProperty = await this.propertyService.create({
        ...createPropertyDto,
        room_id,
      });
      return new ApiResponse(
        201,
        'Property created successfully',
        createdProperty,
      );
    } catch (e) {
      return new ApiResponse(500, e.message, null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAll(@Param('room_id') room_id: string, @Req() { user }: Request) {
    try {
      const room = await this.roomService.findOne(room_id, user.userId);

      if (!room) {
        return new ApiResponse(401, 'Room not found', null);
      }

      const properties = await this.propertyService.findAll(room_id);
      return new ApiResponse(200, 'Properties found', properties);
    } catch (err) {
      return new ApiResponse(500, err.message, null);
    }
  }

  @Get('update')
  async update(
    @Query('name') name: string,
    @Query('value') value: string,
    @Query('key') key: string,
    @Param('room_id') room_id: string,
  ) {
    try {
      if (!key) return new ApiResponse(403, 'API Key missing', null);
      //verify ownership of the room before updating
      const room = await this.roomService.findByKey(key, room_id);

      if (!room) {
        return new ApiResponse(401, 'Room not found', null);
      }

      const updatedProperty = await this.propertyService.update(
        room_id,
        name,
        value,
      );
      return new ApiResponse(
        200,
        'Property updated successfully',
        updatedProperty,
      );
    } catch (e) {
      return new ApiResponse(500, e.message, null);
    }
  }
}
