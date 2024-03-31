import { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import ApiResponse from '../Response';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @Body() createDeviceDto: CreateDeviceDto,
    @Req() { user }: Request,
  ) {
    try {
      const newDevice = await this.devicesService.create(
        createDeviceDto,
        user.orgId,
      );

      return new ApiResponse(201, 'Device created', newDevice);
    } catch (e) {
      console.log(e);
      return new ApiResponse(500, 'Internal server error', null);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAll(@Req() { user }: Request) {
    try {
      const devices = await this.devicesService.findAll(user.orgId);
      return new ApiResponse(200, 'Devices found', devices);
    } catch (e) {
      console.log(e);
      return new ApiResponse(500, 'Internal server error', null);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('read/:id')
  async findOne(@Param('id') id: string, @Req() { user }: Request) {
    try {
      const device = await this.devicesService.findOne(id, user.orgId);
      if (!device) {
        return new ApiResponse(404, 'Device not found', null);
      }

      return new ApiResponse(200, 'Device found', device);
    } catch (e) {
      console.log(e);
      return new ApiResponse(500, 'Internal server error', null);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
    @Req() { user }: Request,
  ) {
    try {
      await this.devicesService.update(id, updateDeviceDto, user.orgId);
      return new ApiResponse(200, 'Device updated', null);
    } catch (e) {
      console.log(e);
      return new ApiResponse(500, 'Internal server error', null);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async remove(@Param('id') id: string, @Req() { user }: Request) {
    try {
      await this.devicesService.remove(id, user.orgId);
      return new ApiResponse(200, 'Device deleted', null);
    } catch (err) {
      console.log(err);
      return new ApiResponse(500, 'Internal server error', null);
    }
  }
}
