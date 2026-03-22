import { Injectable } from '@nestjs/common';
import type {
  GroupWirdTrackingDto,
  GroupWirdTrackingRowDto,
  DayWirdDto,
  RecordedWirdStatus,
  WirdStatus,
  WeekWithCurrentFlagDto,
  ISODateOnlyString,
  ISODateString,
  StudentWeekWirdsDto,
  StudentDayWird,
  UpdateStudentWirdsDto,
} from '@wirdi/shared';
import { getNowAsUTC, addDaysToDateStr, dateToISODateOnly } from '@wirdi/shared';
import { DatabaseService } from '../database/database.service';

/** Arabic display order: Sat(6) → Sun(0) → Mon(1) → Tue(2) → Wed(3) → Thu(4) */
const DISPLAY_DAY_ORDER = [6, 0, 1, 2, 3, 4] as const;

/** Narrows Prisma WirdStatus string to the shared RecordedWirdStatus type */
function toRecordedStatus(status: string): RecordedWirdStatus | null {
  if (status === 'ATTENDED' || status === 'MISSED' || status === 'LATE') return status;
  return null;
}

@Injectable()
export class StudentWirdService {
  constructor(private readonly db: DatabaseService) {}

  async getGroupWeeks(groupId: string): Promise<WeekWithCurrentFlagDto[]> {
    const weeks = await this.db.week.findMany({
      where: { groupId },
      include: { scheduleImages: true },
      orderBy: { weekNumber: 'asc' },
    });

    const todayUTC = getNowAsUTC().split('T')[0] as ISODateOnlyString;

    const mapped = weeks.map((week) => {
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
        scheduleImages: week.scheduleImages.map((img) => ({
          id: img.id,
          weekId: img.weekId,
          name: img.name,
          imageUrl: img.imageUrl,
          createdAt: img.createdAt.toISOString() as ISODateString,
        })),
        isCurrent,
        isUpcoming,
        isDefault: false,
      };
    });

    // Mark the default tab: current week if exists, otherwise the last non-upcoming week
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
          where: {
            groupId,
            expiresAt: { gt: now },
          },
        }),
      ]);

    const startStr = dateToISODateOnly(week.startDate);
    const todayUTC = getNowAsUTC().split('T')[0] as ISODateOnlyString;

    const wirdMap = new Map<string, typeof wirds>();
    for (const wird of wirds) {
      const key = wird.studentId;
      if (!wirdMap.has(key)) wirdMap.set(key, []);
      wirdMap.get(key)!.push(wird);
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
      const studentWirds = wirdMap.get(member.studentId) ?? [];

      const days: DayWirdDto[] = DISPLAY_DAY_ORDER.map((dayNum) => {
        const record = studentWirds.find((w) => w.dayNumber === dayNum);
        const offset = (dayNum + 1) % 7;
        const dayDate = addDaysToDateStr(startStr, offset);
        const wirdStatus: WirdStatus = record
          ? (toRecordedStatus(record.status) ?? 'EMPTY')
          : dayDate > todayUTC
            ? 'FUTURE'
            : 'EMPTY';

        if (!record) {
          return { dayNumber: dayNum, wirdStatus };
        }
        return {
          dayNumber: record.dayNumber,
          wirdStatus,
          readOnMateId: record.readOnMateId ?? undefined,
          readOnMateName: record.readOnMate?.name ?? undefined,
          recordedAt: record.recordedAt.toISOString() as ISODateString,
        };
      });

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
}
