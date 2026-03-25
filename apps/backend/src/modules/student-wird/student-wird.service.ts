import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type {
  GroupMemberDto,
  GroupWirdTrackingDto,
  GroupWirdTrackingRowDto,
  DayWirdDto,
  LearnerGroupOverviewDto,
  RecordableDayStatus,
  RecordLearnerWirdDto,
  RecordedWirdStatus,
  WeekStatusFlagsDto,
  WeekWithCurrentFlagDto,
  ISODateOnlyString,
  ISODateString,
  StudentWeekWirdsDto,
  StudentDayWird,
  UpdateStudentWirdsDto,
  TimeMinutes,
} from '@wirdi/shared';
import {
  getNowAsUTC,
  addDaysToDateStr,
  dateToISODateOnly,
  combineDateTime,
  getStartAndEndOfDay,
} from '@wirdi/shared';
import { DatabaseService } from '../database/database.service';

/** Arabic display order: Sat(6) → Sun(0) → Mon(1) → Tue(2) → Wed(3) → Thu(4) */
const DISPLAY_DAY_ORDER = [6, 0, 1, 2, 3, 4] as const;

/** 4:00 PM as minutes from midnight */
const FOUR_PM: TimeMinutes = (16 * 60) as TimeMinutes;

type WirdRecord = {
  dayNumber: number;
  status: string;
  readOnMateId: string | null;
  readOnMate: { name: string } | null;
  recordedAt: Date;
};

function toRecordedStatus(status: string): RecordedWirdStatus | null {
  if (status === 'ATTENDED' || status === 'MISSED' || status === 'LATE') return status;
  return null;
}

@Injectable()
export class StudentWirdService {
  constructor(private readonly db: DatabaseService) {}

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Builds the 6-day display array for one student.
   * Extracted so both getWeekTracking and getLearnerGroupOverview share the same logic.
   */
  private buildStudentDays(
    wirds: WirdRecord[],
    startStr: ISODateOnlyString,
    todayUTC: ISODateOnlyString
  ): DayWirdDto[] {
    return DISPLAY_DAY_ORDER.map((dayNum) => {
      const record = wirds.find((w) => w.dayNumber === dayNum);
      const offset = (dayNum + 1) % 7;
      const dayDate = addDaysToDateStr(startStr, offset);
      const wirdStatus = record
        ? (toRecordedStatus(record.status) ?? 'EMPTY')
        : dayDate > todayUTC
          ? 'FUTURE'
          : 'EMPTY';

      if (!record) return { dayNumber: dayNum, wirdStatus };

      return {
        dayNumber: record.dayNumber,
        wirdStatus,
        readOnMateId: record.readOnMateId ?? undefined,
        readOnMateName: record.readOnMate?.name ?? undefined,
        recordedAt: record.recordedAt.toISOString() as ISODateString,
      };
    });
  }

  /**
   * Finds the first EMPTY day the learner can still record, based on the allowed time window:
   * - Same day until end-of-day (on time)
   * - Next day until 4:00 PM in group timezone (late)
   * - Thursday special: next day is Saturday (skips Friday)
   */
  private computeRecordableDay(
    days: DayWirdDto[],
    startStr: ISODateOnlyString,
    groupTimezone: string,
    now: Date
  ): RecordableDayStatus {
    for (const day of days) {
      if (day.wirdStatus !== 'EMPTY') continue;

      const offset = (day.dayNumber + 1) % 7;
      const dayDate = addDaysToDateStr(startStr, offset);

      // Thu (dayNumber=4) → next day is Sat (+2); others → next day (+1)
      const nextDayOffset = day.dayNumber === 4 ? 2 : 1;
      const deadlineDateStr = addDaysToDateStr(dayDate, nextDayOffset);
      const deadline = combineDateTime(deadlineDateStr, FOUR_PM, groupTimezone);

      if (now.toISOString() <= deadline) {
        const { endAsJSDate } = getStartAndEndOfDay(groupTimezone, dayDate);
        return { status: 'available', dayNumber: day.dayNumber, isLate: now > endAsJSDate };
      }
    }

    const allFuture = days.every((d) => d.wirdStatus === 'FUTURE');
    return { status: 'none', reason: allFuture ? 'upcoming' : 'all_recorded' };
  }

  // ─── Admin / Moderator Methods ───────────────────────────────────────────────

  async getGroupWeeks(groupId: string): Promise<WeekWithCurrentFlagDto[]> {
    const weeks = await this.db.week.findMany({
      where: { groupId },
      include: { scheduleImage: true },
      orderBy: { weekNumber: 'asc' },
    });

    const todayUTC = getNowAsUTC().split('T')[0] as ISODateOnlyString;

    const mapped = weeks
      .filter((week) => week.scheduleImage)
      .map((week): WeekWithCurrentFlagDto => {
        const img = week.scheduleImage!;
        const startStr = dateToISODateOnly(week.startDate);
        const endStr = dateToISODateOnly(week.endDate);
        const isCurrent = todayUTC >= startStr && todayUTC <= endStr;
        const isUpcoming = startStr > todayUTC;

        return {
          id: week.id,
          groupId: week.groupId,
          weekNumber: week.weekNumber,
          startDate: startStr,
          endDate: endStr,
          createdAt: week.createdAt.toISOString() as ISODateString,
          scheduleImage: {
            id: img.id,
            weekId: img.weekId,
            name: img.name,
            imageUrl: img.imageUrl,
            createdAt: img.createdAt.toISOString() as ISODateString,
          },
          isCurrent,
          isUpcoming,
          isDefault: false,
        };
      });

    const defaultWeek =
      mapped.find((w) => w.isCurrent) ?? [...mapped].reverse().find((w) => !w.isUpcoming);
    if (defaultWeek) defaultWeek.isDefault = true;

    return mapped;
  }

  async getWeekTracking(groupId: string, weekId: string): Promise<GroupWirdTrackingDto> {
    const now = new Date();

    const [week, members, wirds, weekAlertCounts, totalAlertCounts, activeExcuses] =
      await this.db.$transaction([
        this.db.week.findUniqueOrThrow({ where: { id: weekId } }),
        this.db.groupMember.findMany({
          where: { groupId },
          include: { student: true },
          orderBy: { joinedAt: 'asc' },
        }),
        this.db.studentWird.findMany({
          where: { weekId, week: { groupId } },
          include: { readOnMate: true },
        }),
        this.db.alert.findMany({
          where: { weekId },
          select: { studentId: true },
        }),
        this.db.alert.findMany({
          where: { groupId },
          select: { studentId: true },
        }),
        this.db.excuse.findMany({
          where: { groupId, expiresAt: { gt: now } },
        }),
      ]);

    const startStr = dateToISODateOnly(week.startDate);
    const todayUTC = getNowAsUTC().split('T')[0] as ISODateOnlyString;

    const wirdMap = new Map<string, typeof wirds>();
    for (const wird of wirds) {
      if (!wirdMap.has(wird.studentId)) wirdMap.set(wird.studentId, []);
      wirdMap.get(wird.studentId)!.push(wird);
    }

    const weekAlertMap = new Map<string, number>();
    for (const entry of weekAlertCounts) {
      weekAlertMap.set(entry.studentId, (weekAlertMap.get(entry.studentId) ?? 0) + 1);
    }

    const totalAlertMap = new Map<string, number>();
    for (const entry of totalAlertCounts) {
      totalAlertMap.set(entry.studentId, (totalAlertMap.get(entry.studentId) ?? 0) + 1);
    }

    const activeExcuseMap = new Map<string, ISODateString>();
    for (const excuse of activeExcuses) {
      activeExcuseMap.set(excuse.studentId, excuse.expiresAt.toISOString() as ISODateString);
    }

    const rows: GroupWirdTrackingRowDto[] = members.map((member) => {
      const days = this.buildStudentDays(wirdMap.get(member.studentId) ?? [], startStr, todayUTC);

      return {
        memberId: member.id,
        studentId: member.studentId,
        studentName: member.student.name,
        days,
        weekAlertCount: weekAlertMap.get(member.studentId) ?? 0,
        totalAlertCount: totalAlertMap.get(member.studentId) ?? 0,
        activeExcuseExpiresAt: activeExcuseMap.get(member.studentId),
      };
    });

    return { weekId, rows };
  }

  async getStudentWeekWirds(studentId: string, weekId: string): Promise<StudentWeekWirdsDto> {
    const [week, studentWirds] = await this.db.$transaction([
      this.db.week.findUniqueOrThrow({ where: { id: weekId } }),
      this.db.studentWird.findMany({ where: { studentId, weekId } }),
    ]);

    const todayUTC = getNowAsUTC().split('T')[0] as ISODateOnlyString;
    const startStr = dateToISODateOnly(week.startDate);
    const wirdByDay = new Map(studentWirds.map((w) => [w.dayNumber, w]));

    const days: StudentDayWird[] = DISPLAY_DAY_ORDER.map((dayNum) => {
      const offset = (dayNum + 1) % 7;
      const dayDate = addDaysToDateStr(startStr, offset);
      const record = wirdByDay.get(dayNum);
      return {
        dayNumber: dayNum,
        recordedStatus: record ? toRecordedStatus(record.status) : null,
        isBlocked: dayDate > todayUTC,
      };
    });

    return { studentId, weekId, days };
  }

  async updateStudentWeekWirds(
    studentId: string,
    weekId: string,
    dto: UpdateStudentWirdsDto
  ): Promise<void> {
    const now = new Date();
    await this.db.$transaction(
      dto.updates.map((update) =>
        this.db.studentWird.upsert({
          where: { studentId_weekId_dayNumber: { studentId, weekId, dayNumber: update.dayNumber } },
          create: {
            studentId,
            weekId,
            dayNumber: update.dayNumber,
            status: update.status,
            recordedAt: now,
          },
          update: {
            status: update.status,
            recordedAt: now,
          },
        })
      )
    );
  }

  // ─── Learner Self-Recording Methods ─────────────────────────────────────────

  async getLearnerGroupOverview(
    groupId: string,
    studentId: string
  ): Promise<LearnerGroupOverviewDto> {
    const now = new Date();
    const todayUTC = dateToISODateOnly(now);

    // Most recent started week — covers current week or last past week in one query
    const week = await this.db.week.findFirst({
      where: { groupId, startDate: { lte: now } },
      include: { scheduleImage: true, group: { select: { timezone: true } } },
      orderBy: { weekNumber: 'desc' },
    });

    if (!week?.scheduleImage) {
      throw new BadRequestException('لا يوجد أسبوع نشط لهذه الحلقة بعد');
    }

    const [member, wirds, weekAlertCount, totalAlertCount] = await this.db.$transaction([
      this.db.groupMember.findFirstOrThrow({
        where: { groupId, studentId },
        include: { student: true, mate: true },
      }),
      this.db.studentWird.findMany({
        where: { studentId, weekId: week.id },
        include: { readOnMate: true },
      }),
      this.db.alert.count({ where: { studentId, weekId: week.id } }),
      this.db.alert.count({ where: { studentId, groupId } }),
    ]);

    const startStr = dateToISODateOnly(week.startDate);
    const endStr = dateToISODateOnly(week.endDate);

    const days = this.buildStudentDays(wirds, startStr, todayUTC);

    const myRow: GroupWirdTrackingRowDto = {
      memberId: member.id,
      studentId: member.studentId,
      studentName: member.student.name,
      days,
      weekAlertCount,
      totalAlertCount,
    };

    const myMembership: GroupMemberDto = {
      id: member.id,
      groupId: member.groupId,
      studentId: member.studentId,
      studentName: member.student.name,
      studentUsername: member.student.username,
      studentTimezone: member.student.timezone,
      mateId: member.mateId ?? undefined,
      mateName: member.mate?.name ?? undefined,
      notes: member.student.notes ?? undefined,
      joinedAt: member.joinedAt.toISOString() as ISODateString,
    };

    const isCurrent = todayUTC >= startStr && todayUTC <= endStr;
    const isUpcoming = startStr > todayUTC;

    const weekDto: WeekStatusFlagsDto = {
      id: week.id,
      groupId: week.groupId,
      weekNumber: week.weekNumber,
      startDate: startStr,
      endDate: endStr,
      createdAt: week.createdAt.toISOString() as ISODateString,
      scheduleImage: {
        id: week.scheduleImage.id,
        weekId: week.scheduleImage.weekId,
        name: week.scheduleImage.name,
        imageUrl: week.scheduleImage.imageUrl,
        createdAt: week.scheduleImage.createdAt.toISOString() as ISODateString,
      },
      isCurrent,
      isUpcoming,
    };

    const recordableDay = this.computeRecordableDay(days, startStr, week.group.timezone, now);

    return { week: weekDto, myRow, myMembership, recordableDay };
  }

  async recordLearnerWird(studentId: string, dto: RecordLearnerWirdDto): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const member = await tx.groupMember.findFirst({
        where: { groupId: dto.groupId, studentId },
        select: { id: true },
      });
      if (!member) throw new ForbiddenException('لست عضواً في هذه الحلقة');

      const group = await tx.group.findUniqueOrThrow({
        where: { id: dto.groupId },
        select: { timezone: true },
      });

      const week = await tx.week.findUniqueOrThrow({ where: { id: dto.weekId } });

      const startStr = dateToISODateOnly(week.startDate);
      const offset = (dto.dayNumber + 1) % 7;
      const dayDate = addDaysToDateStr(startStr, offset);

      const now = new Date();
      const nextDayOffset = dto.dayNumber === 4 ? 2 : 1;
      const deadlineDateStr = addDaysToDateStr(dayDate, nextDayOffset);
      const deadline = combineDateTime(deadlineDateStr, FOUR_PM, group.timezone);

      if (now.toISOString() > deadline) {
        throw new BadRequestException('انتهت مدة تسجيل هذا اليوم');
      }

      const { endAsJSDate } = getStartAndEndOfDay(group.timezone, dayDate);
      const status = now > endAsJSDate ? 'LATE' : 'ATTENDED';

      await tx.studentWird.upsert({
        where: {
          studentId_weekId_dayNumber: { studentId, weekId: dto.weekId, dayNumber: dto.dayNumber },
        },
        create: {
          studentId,
          weekId: dto.weekId,
          dayNumber: dto.dayNumber,
          status,
          readOnMateId: dto.mateId ?? null,
          recordedAt: now,
        },
        update: {
          status,
          readOnMateId: dto.mateId ?? null,
          recordedAt: now,
        },
      });

      // Policy: LATE recording cancels any existing missed alert for that week
      if (status === 'LATE') {
        await tx.alert.deleteMany({ where: { studentId, weekId: dto.weekId } });
      }
    });
  }
}
