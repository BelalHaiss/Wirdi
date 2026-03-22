import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { UserRole } from 'generated/prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import { updateStudentWirdsSchema } from '@wirdi/shared';
import type {
  GroupWirdTrackingDto,
  WeekWithCurrentFlagDto,
  StudentWeekWirdsDto,
  UpdateStudentWirdsDto,
} from '@wirdi/shared';
import { StudentWirdService } from './student-wird.service';

@Controller('student-wird')
export class StudentWirdController {
  constructor(private readonly studentWirdService: StudentWirdService) {}

  @Get('group/:groupId/weeks')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  getGroupWeeks(@Param('groupId') groupId: string): Promise<WeekWithCurrentFlagDto[]> {
    return this.studentWirdService.getGroupWeeks(groupId);
  }

  @Get('group/:groupId/week/:weekId')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  getWeekTracking(
    @Param('groupId') groupId: string,
    @Param('weekId') weekId: string
  ): Promise<GroupWirdTrackingDto> {
    return this.studentWirdService.getWeekTracking(groupId, weekId);
  }

  @Get('student/:studentId/week/:weekId')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  getStudentWeekWirds(
    @Param('studentId') studentId: string,
    @Param('weekId') weekId: string
  ): Promise<StudentWeekWirdsDto> {
    return this.studentWirdService.getStudentWeekWirds(studentId, weekId);
  }

  @Patch('student/:studentId/week/:weekId')
  @Roles([UserRole.ADMIN, UserRole.MODERATOR])
  updateStudentWeekWirds(
    @Param('studentId') studentId: string,
    @Param('weekId') weekId: string,
    @Body(new ZodValidationPipe(updateStudentWirdsSchema('en'))) dto: UpdateStudentWirdsDto
  ): Promise<void> {
    return this.studentWirdService.updateStudentWeekWirds(studentId, weekId, dto);
  }
}
