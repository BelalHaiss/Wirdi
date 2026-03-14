import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { FileModule } from '../file/file.module';

@Module({
  imports: [DatabaseModule, FileModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
