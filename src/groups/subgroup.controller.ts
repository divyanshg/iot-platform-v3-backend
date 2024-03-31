import { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import ApiResponse from '../Response';
import { CreateSubgrpDTO } from './dto/create-group.dto';
import { GroupsService } from './groups.service';

@Controller('subgroups')
export class SubgroupController {
  constructor(private groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createSubgroup(@Body() createSubgrpDTO: CreateSubgrpDTO) {
    try {
      const subGrpId = await this.groupsService.createSubgrp(createSubgrpDTO);

      return new ApiResponse(201, 'Subgroup created', {
        id: subGrpId,
      });
    } catch (err) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:group_id/list')
  async listAll(@Param('group_id') group_id: string) {
    try {
      const subGroups = await this.groupsService.findAllSubGrp(group_id);
      return new ApiResponse(200, 'Subgroups fetched', subGroups);
    } catch (err) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('read/:id')
  async getSubgrpById(@Param('id') id: string) {
    try {
      const subGroup = await this.groupsService.findOneSubGrp(id);

      return new ApiResponse(200, 'Subgroup fetched', subGroup);
    } catch (err) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteSubgrp(@Param('id') id: string) {
    try {
      await this.groupsService.removeSubGrp(id);
      return new ApiResponse(200, 'Subgroup has been deleted!', null);
    } catch (err) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }
}
