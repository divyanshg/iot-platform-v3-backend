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
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @Body() createGroupDto: CreateGroupDto,
    @Req() { user }: Request,
  ) {
    try {
      const newGroupId = await this.groupsService.create(
        createGroupDto,
        user.userId,
      );

      return new ApiResponse(201, 'Group created', {
        id: newGroupId,
      });
    } catch (err) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAll(@Req() { user }: Request) {
    try {
      const groups = await this.groupsService.findAll(user.userId);
      return new ApiResponse(200, 'Groups fetched', groups);
    } catch (err) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('read/:id')
  async findOne(@Param('id') id: string) {
    try {
      const group = await this.groupsService.findOne(id);

      return new ApiResponse(200, 'Group fetched', group);
    } catch (err) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    try {
      await this.groupsService.update(id, updateGroupDto);
      return new ApiResponse(200, 'Group updated', null);
    } catch (err) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    try {
      await this.groupsService.remove(id);
      return new ApiResponse(200, 'Group has been deleted', null);
    } catch (err) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }
}
