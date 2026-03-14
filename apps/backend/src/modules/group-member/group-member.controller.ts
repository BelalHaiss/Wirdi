import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from 'generated/prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import {
  assignLearnersToGroupSchema,
  createAndAssignLearnersSchema,
  updateMemberMateSchema,
  type AssignLearnersToGroupDto,
  type CreateAndAssignLearnersDto,
  type UpdateMemberMateDto,
} from '@wirdi/shared';
import { GroupMemberService } from './group-member.service';

@Controller('group-member')
export class GroupMemberController {
  constructor(private readonly groupMemberService: GroupMemberService) {}

  @Post('group-learners/create')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  createAndAssignLearners(
    @Body(new ZodValidationPipe(createAndAssignLearnersSchema('en')))
    dto: CreateAndAssignLearnersDto
  ) {
    return this.groupMemberService.createAndAssignLearners(dto);
  }

  @Post('group-learners/assign')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  assignLearnersToGroup(
    @Body(new ZodValidationPipe(assignLearnersToGroupSchema('en')))
    dto: AssignLearnersToGroupDto
  ) {
    return this.groupMemberService.assignLearnersToGroup(dto);
  }

  @Patch(':id/mate')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  updateMate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMemberMateSchema()))
    dto: UpdateMemberMateDto
  ) {
    return this.groupMemberService.updateMate(id, dto);
  }

  @Delete(':id')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(@Param('id') id: string) {
    return this.groupMemberService.removeMember(id);
  }
}
