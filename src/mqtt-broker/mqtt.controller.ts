import { Response } from 'express';

import { Controller, Get, Inject, Param, Res } from '@nestjs/common';

import { PigeonService } from '../pigeon';
import { PrismaServiceV2 } from '../prisma/prismav2.service';
import { nodeScript } from '../start-scripts';

@Controller('mqtt')
export class MqttController {
  constructor(
    private prisma: PrismaServiceV2,
    @Inject(PigeonService) private readonly aedesService: PigeonService,
  ) {}
  @Get('/config/:device_id/:sdk')
  async generateConfig(
    @Param('device_id') device_id: string,
    @Param('sdk') sdk: string,
    @Res({
      passthrough: true,
    })
    res: Response,
  ) {
    const device = await this.prisma.device.findUnique({
      where: {
        id: device_id,
      },
    });

    if (!device) {
      res.status(404).send('Device not found');
      return;
    }

    //download the file
    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="start.sh"',
    });
    return nodeScript(device_id, device.key);
  }

  @Get()
  someGet() {
    this.aedesService.publish({
      topic: '65fc78e2d89991a580b78c35/temp',
      qos: 0,
      cmd: 'publish',
      payload: 'works',
      dup: false,
      retain: false,
    });
  }
}
