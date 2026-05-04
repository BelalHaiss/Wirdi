import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import type {
  ChangeOwnPasswordDto,
  CreateStaffUserDto,
  CreateLearnerDto,
  LearnerDto,
  PromoteLearnersToModeratorDto,
  StaffUserDto,
  StaffUsersResponseDto,
  QueryLearnersDto,
  QueryLearnersResponseDto,
  UpdateOwnProfileDto,
  UpdateStaffUserDto,
  UpdateLearnerDto,
  UserAuthType,
} from '@wirdi/shared';
import { minutesToInputTimeString, TimeMinutes, TIMEZONES } from '@wirdi/shared';
import { UserRole } from 'generated/prisma/client';
import type { User as UserEntity } from 'generated/prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/decorators/user.decorator';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import {
  createLearnerSchema,
  queryLearnersSchema,
  updateLearnerSchema,
  createStaffSchema,
  updateStaffSchema,
  changeOwnPasswordSchema,
  updateOwnProfileSchema,
  promoteLearnersToModeratorSchema,
} from '@wirdi/shared';
import { UserService } from './user.service';
import { ExportService } from '../export/export.service';
import { DatabaseService } from '../database/database.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly exportService: ExportService,
    private readonly prismaService: DatabaseService
  ) {}

  @Post('learner')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  createLearner(
    @Body(new ZodValidationPipe(createLearnerSchema('en')))
    dto: CreateLearnerDto
  ): Promise<LearnerDto> {
    return this.userService.createLearner(dto);
  }

  @Get('learner')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  queryLearners(
    @Query(new ZodValidationPipe(queryLearnersSchema('en')))
    query: QueryLearnersDto
  ): Promise<QueryLearnersResponseDto> {
    return this.userService.queryLearners(query);
  }

  @Get('learner/export')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  async exportLearnersCsv(@Res() response: Response): Promise<void> {
    // Fetch raw data with group memberships
    const learners = await this.prismaService.user.findMany({
      where: { role: UserRole.STUDENT },
      orderBy: { name: 'asc' },
      select: {
        username: true,
        name: true,
        timezone: true,
        notes: true,
        age: true,
        platform: true,
        schedule: true,
        recitation: true,
        groupMemberships: {
          select: { group: { select: { name: true } } },
        },
      },
    });

    const rows = learners.map((learner) => ({
      name: learner.name,
      username: learner.username ?? '',
      timezone: TIMEZONES.find((tz) => tz.value === learner.timezone)?.label ?? learner.timezone,
      groups: (learner.groupMemberships ?? [])
        .map((m) => m.group?.name)
        .filter(Boolean)
        .join('; '),
      notes: learner.notes ?? '',
      age: learner.age != null ? String(learner.age) : '',
      platform: learner.platform ?? '',
      schedule:
        learner.schedule != null ? minutesToInputTimeString(learner.schedule as TimeMinutes) : '',
      recitation: learner.recitation ?? '',
    }));

    const file = this.exportService.toCsv(rows, [
      { key: 'name', label: 'اسم الطالب' },
      { key: 'username', label: 'اسم المستخدم' },
      { key: 'timezone', label: 'البلد' },
      { key: 'groups', label: 'المجموعات' },
      { key: 'notes', label: 'الملاحظات' },
      { key: 'age', label: 'السن' },
      { key: 'platform', label: 'الوسيلة' },
      { key: 'schedule', label: 'الموعد' },
      { key: 'recitation', label: 'الرواية' },
    ]);

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="learners.csv"');
    response.send(file);
  }

  @Patch('learner/:id')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  updateLearner(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLearnerSchema('en')))
    dto: UpdateLearnerDto
  ): Promise<LearnerDto> {
    return this.userService.updateLearner(id, dto);
  }

  @Delete('learner/:id')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  async deleteLearner(@Param('id') id: string): Promise<void> {
    await this.userService.deleteLearner(id);
  }

  @Post('learner/promote')
  @Roles([UserRole.ADMIN])
  async promoteLearnersToModerator(
    @Body(new ZodValidationPipe(promoteLearnersToModeratorSchema('en')))
    dto: PromoteLearnersToModeratorDto
  ): Promise<void> {
    await this.userService.promoteLearnersToModerator(dto.studentIds);
  }

  @Get('staff')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  getStaffUsers(@User() actor: UserEntity): Promise<StaffUsersResponseDto> {
    return this.userService.getStaffUsers(actor);
  }

  @Post('staff')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  createStaffUser(
    @User() actor: UserEntity,
    @Body(new ZodValidationPipe(createStaffSchema('en')))
    dto: CreateStaffUserDto
  ): Promise<StaffUserDto> {
    return this.userService.createStaffUser(actor, dto);
  }

  @Patch('staff/:id')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  updateStaffUser(
    @Param('id') id: string,
    @User() actor: UserEntity,
    @Body(new ZodValidationPipe(updateStaffSchema('en')))
    dto: UpdateStaffUserDto
  ): Promise<StaffUserDto> {
    return this.userService.updateStaffUser(id, actor, dto);
  }

  @Delete('staff/:id')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  async deleteStaffUser(@Param('id') id: string, @User() actor: UserEntity): Promise<void> {
    await this.userService.deleteStaffUser(id, actor);
  }

  @Get('me')
  getMe(@User() user: UserEntity): Promise<UserAuthType> {
    return this.userService.getMe(user.id);
  }

  @Patch('me/profile')
  updateOwnProfile(
    @User() user: UserEntity,
    @Body(new ZodValidationPipe(updateOwnProfileSchema('en')))
    dto: UpdateOwnProfileDto
  ): Promise<UserAuthType> {
    return this.userService.updateOwnProfile(user.id, dto);
  }

  @Post('me/change-password')
  async changeOwnPassword(
    @User() user: UserEntity,
    @Body(new ZodValidationPipe(changeOwnPasswordSchema('en')))
    dto: ChangeOwnPasswordDto
  ): Promise<void> {
    await this.userService.changeOwnPassword(user.id, dto);
  }
}
