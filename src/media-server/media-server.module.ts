import * as NodeMediaServer from 'node-media-server';

import { Module, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RoomModule } from '../room/room.module';
import { RoomService } from '../room/room.service';

@Module({
  imports: [RoomModule],
  providers: [RoomService, PrismaService],
})
export class MediaServerModule implements OnModuleInit {
  private readonly nms: NodeMediaServer;

  constructor() {
    this.nms = new NodeMediaServer({
      rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        port: 8000,
        allow_origin: '*',
      },
      auth: {
        api: true,
        api_user: 'admin',
        api_pass: 'dg2024',
      },
    });
  }

  onModuleInit() {
    this.nms.on('prePublish', async (id, StreamPath, args) => {
      // const roomId = StreamPath.split('/')[2];
      // const apiKey = args.key;
      // if (!apiKey || !roomId) {
      //   const session = this.nms.getSession(id);
      //   session.reject();
      // }
      // const room = await this.roomService.findByKey(apiKey, roomId);
      // if (!room) {
      //   const session = this.nms.getSession(id);
      //   session.reject();
      // }
    });

    this.nms.run();
  }
}
