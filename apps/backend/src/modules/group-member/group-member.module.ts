import { Module } from '@nestjs/common';
import { GroupMemberController } from './group-member.controller';
import { GroupMemberService } from './group-member.service';

@Module({
  controllers: [GroupMemberController],
  providers: [GroupMemberService],
})
export class GroupMemberModule {}
