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
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PoliciesService } from './policies.service';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @Body() createPolicyDto: CreatePolicyDto,
    @Req() { user }: Request,
  ) {
    try {
      const newPolicy = await this.policiesService.create(
        createPolicyDto,
        user.orgId,
      );
      return new ApiResponse(201, 'Policy created', newPolicy);
    } catch (e) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAll(@Req() { user }: Request) {
    try {
      const policies = await this.policiesService.findAll(user.orgId);
      return new ApiResponse(200, 'Success', policies);
    } catch (e) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('read/:id')
  async findOne(@Param('id') id: string, @Req() { user }: Request) {
    try {
      const policy = await this.policiesService.findOne(id, user.orgId);
      return new ApiResponse(200, 'Success', policy);
    } catch (e) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
    @Req() { user }: Request,
  ) {
    try {
      const updatedPolicy = await this.policiesService.update(
        id,
        updatePolicyDto,
        user.orgId,
      );
      return new ApiResponse(200, 'Policy updated', updatedPolicy);
    } catch (e) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async remove(@Param('id') id: string, @Req() { user }: Request) {
    try {
      await this.policiesService.remove(id, user.orgId);
      return new ApiResponse(200, 'Policy deleted', null);
    } catch (e) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }
}
