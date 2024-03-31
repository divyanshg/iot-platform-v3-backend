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
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Req() { user }: Request,
  ) {
    try {
      const createResponse = await this.organizationService.create(
        createOrganizationDto,
        user.userId,
      );

      return new ApiResponse(
        createResponse.status,
        createResponse.message,
        createResponse.data,
      );
    } catch (e) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAll(@Req() { user }: Request) {
    try {
      const orgs = await this.organizationService.findAll(user.userId);
      return new ApiResponse(200, 'Organizations retrieved successfully', orgs);
    } catch (e) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('read/:id')
  async findOne(@Param('id') id: string, @Req() { user }: Request) {
    try {
      const org = await this.organizationService.findOne(id, user.userId);
      return new ApiResponse(200, 'Organization retrieved successfully', org);
    } catch (e) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(+id, updateOrganizationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.organizationService.remove(+id);
  }
}
