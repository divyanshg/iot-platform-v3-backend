import * as archiver from 'archiver';
import { Request, Response } from 'express';
import * as fs from 'fs';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import ApiResponse from '../Response';
import { CertificatesService } from './certificates.service';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @Req() { user }: Request,
    @Body('policy_id') policy_id: string,
    @Body('type') type: 'NORMAL' | 'CLAIM',
    @Body('status') status: 'ACTIVE' | 'INACTIVE',
  ) {
    try {
      const certificateResponse = await this.certificatesService.create(
        user.orgId,
        policy_id,
        type,
        status,
      );
      return new ApiResponse(
        201,
        'Certificate created',
        'http://localhost:3000/certificates/download/' + certificateResponse,
      );
    } catch (e) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAll(@Req() { user }: Request) {
    try {
      const certificates = await this.certificatesService.findAll(user.orgId);
      return new ApiResponse(200, 'Success', certificates);
    } catch (e) {
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @Get('read/:id')
  findOne(@Param('id') id: string, @Req() { user }: Request) {
    return this.certificatesService.findOne(id, user.orgId);
  }

  @Patch('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateCertificateDto: UpdateCertificateDto,
    @Req() { user }: Request,
  ) {
    return this.certificatesService.update(
      id,
      updateCertificateDto,
      user.orgId,
    );
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string, @Req() { user }: Request) {
    return this.certificatesService.remove(id, user.orgId);
  }

  @Get('download/:certificate_id')
  async download(@Param('certificate_id') id: string, @Res() res: Response) {
    const certificateExists =
      await this.certificatesService.certificateExists(id);

    if (!certificateExists) {
      return new ApiResponse(404, 'Certificate not found', null);
    }

    const certsPath = `./generated/${id}`;

    //check if the certificate directory exists
    if (!fs.existsSync(certsPath)) {
      return res.status(404).send('Certificate not found');
    }

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${id}.zip`);

    archive.pipe(res);

    archive.directory(certsPath, false);

    archive.on('error', (err) => {
      throw err;
    });

    archive.finalize();
  }
}
