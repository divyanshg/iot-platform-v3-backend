import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { SubgroupController } from './subgroup.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GroupsController, SubgroupController],
  providers: [GroupsService],
})
export class GroupsModule {}
