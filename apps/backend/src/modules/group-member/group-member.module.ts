import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GroupMemberController } from './group-member.controller';
import { GroupMemberService } from './group-member.service';

@Module({
  imports: [DatabaseModule],
  controllers: [GroupMemberController],
  providers: [GroupMemberService],
})
export class GroupMemberModule {}
