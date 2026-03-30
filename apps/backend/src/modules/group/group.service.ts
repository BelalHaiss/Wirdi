import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FileService } from '../file/file.service';
import {
  CreateGroupDto,
  GroupDto,
  GroupMemberDto,
  GroupStatsDto,
  ISODateOnlyString,
  QueryGroupsResponseDto,
  ScheduleImageDto,
  UpdateGroupDto,
  WeekDto,
  AwradType,
  isSaturday,
  addDaysToDateStr,
  getNextSaturdayFrom,
  isDateTodayOrFuture,
  dateOnlyToUTC,
  formatDate,
} from '@wirdi/shared';
import type { User as PrismaUser } from 'generated/prisma/client';

@Injectable()
export class GroupService {
  constructor(
    private readonly db: DatabaseService,
    private readonly fileService: FileService
  ) {}

  // ─── Groups CRUD ────────────────────────────────────────────────────────────

  async getStats(): Promise<GroupStatsDto> {
    const [groupsCount, learnersCount, moderatorsCount] = await Promise.all([
      this.db.group.count(),
      this.db.user.count({ where: { role: 'STUDENT' } }),
      this.db.user.count({ where: { role: 'MODERATOR' } }),
    ]);
    return { groupsCount, learnersCount, moderatorsCount };
  }

  async queryGroups(actor: PrismaUser): Promise<QueryGroupsResponseDto> {
    const where =
      actor.role === 'ADMIN'
        ? {}
        : actor.role === 'MODERATOR'
          ? { moderatorId: actor.id }
          : { members: { some: { studentId: actor.id } } };

    const groups = await this.db.group.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        moderator: { select: { name: true } },
        _count: { select: { members: true, weeks: true } },
      },
    });
    return groups.map((g) => this.toGroupDto(g));
  }

  async getGroupById(id: string, studentId?: string): Promise<GroupDto> {
    const group = await this.db.group.findUnique({
      where: { id },
      include: {
        moderator: { select: { name: true } },
        _count: { select: { members: true, weeks: true } },
        ...(studentId && {
          members: { where: { studentId }, select: { id: true }, take: 1 },
        }),
      },
    });
    if (!group) throw new NotFoundException('المجموعة غير موجودة');
    if (studentId) {
      const g = group as typeof group & { members: { id: string }[] };
      if (!g.members.length) throw new ForbiddenException('لا تملك صلاحية الوصول لهذه الحلقة');
    }
    return this.toGroupDto(group);
  }

  async createGroup(dto: CreateGroupDto): Promise<GroupDto> {
    const group = await this.db.group.create({
      data: {
        name: dto.name,
        status: dto.status ?? 'ACTIVE',
        description: dto.description,
        awrad: dto.awrad,
        moderatorId: dto.moderatorId,
      },
      include: {
        moderator: { select: { name: true } },
        _count: { select: { members: true, weeks: true } },
      },
    });
    return this.toGroupDto(group);
  }

  async updateGroup(id: string, dto: UpdateGroupDto): Promise<GroupDto> {
    const group = await this.db.group.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.status && { status: dto.status }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.awrad && { awrad: dto.awrad }),
        ...(dto.moderatorId !== undefined && { moderatorId: dto.moderatorId || null }),
      },
      include: {
        moderator: { select: { name: true } },
        _count: { select: { members: true, weeks: true } },
      },
    });
    return this.toGroupDto(group);
  }

  async deleteGroup(id: string): Promise<void> {
    await this.db.group.delete({ where: { id } });
  }

  // ─── Weekly Schedules ───────────────────────────────────────────────────────

  async getGroupSchedules(groupId: string): Promise<WeekDto[]> {
    const weeks = await this.db.week.findMany({
      where: { groupId },
      orderBy: { weekNumber: 'asc' },
      include: { scheduleImage: true },
    });
    return weeks
      .filter((w) => w.scheduleImage)
      .map((w) =>
        this.toWeekDto(w as typeof w & { scheduleImage: NonNullable<typeof w.scheduleImage> })
      );
  }

  async createScheduleImage(
    groupId: string,
    saturdayDate: ISODateOnlyString | undefined,
    imageUrl: string,
    scheduleName: string,
    imagekitFileId: string
  ): Promise<WeekDto> {
    const week = await this.db.$transaction(async (tx) => {
      const resolved = await this.resolveWeekForGroup(groupId, saturdayDate, tx);

      let weekRecord = await tx.week.findUnique({
        where: { groupId_weekNumber: { groupId, weekNumber: resolved.weekNumber } },
        include: { scheduleImage: true },
      });

      if (!weekRecord) {
        weekRecord = await tx.week.create({
          data: {
            groupId,
            weekNumber: resolved.weekNumber,
            startDate: resolved.startDate,
            endDate: resolved.endDate,
          },
          include: { scheduleImage: true },
        });
      }

      // If week already has an image, delete old from ImageKit then replace
      if (weekRecord.scheduleImage) {
        await this.fileService
          .deleteFileFromImageKit(weekRecord.scheduleImage.imagekitFileId)
          .catch(() => null);
        await tx.scheduleImage.update({
          where: { weekId: weekRecord.id },
          data: { name: scheduleName, imageUrl, imagekitFileId },
        });
      } else {
        await tx.scheduleImage.create({
          data: { weekId: weekRecord.id, name: scheduleName, imageUrl, imagekitFileId },
        });
      }

      return tx.week.findUniqueOrThrow({
        where: { id: weekRecord.id },
        include: { scheduleImage: true },
      });
    });

    return this.toWeekDto(
      week as typeof week & { scheduleImage: NonNullable<typeof week.scheduleImage> }
    );
  }

  async updateScheduleImage(
    imageId: string,
    newImageUrl?: string,
    newImagekitFileId?: string,
    name?: string
  ): Promise<ScheduleImageDto> {
    const existing = await this.db.scheduleImage.findUnique({ where: { id: imageId } });
    if (!existing) throw new NotFoundException('الصورة غير موجودة');

    if (newImageUrl && existing.imagekitFileId) {
      await this.fileService.deleteFileFromImageKit(existing.imagekitFileId).catch(() => null);
    }

    const updated = await this.db.scheduleImage.update({
      where: { id: imageId },
      data: {
        ...(newImageUrl && { imageUrl: newImageUrl }),
        ...(newImagekitFileId && { imagekitFileId: newImagekitFileId }),
        ...(name && { name }),
      },
    });

    return {
      id: updated.id,
      weekId: updated.weekId,
      name: updated.name,
      imageUrl: updated.imageUrl,
      createdAt: updated.createdAt.toISOString() as ScheduleImageDto['createdAt'],
    };
  }

  // ─── Group Learners ─────────────────────────────────────────────────────────

  async getGroupLearners(groupId: string): Promise<GroupMemberDto[]> {
    const now = new Date();

    const members = await this.db.groupMember.findMany({
      where: { groupId },
      orderBy: { joinedAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            username: true,
            timezone: true,
            notes: true,
            excusesAsStudent: {
              where: { groupId, expiresAt: { gt: now } },
              orderBy: { expiresAt: 'desc' },
              take: 1,
              select: { expiresAt: true },
            },
          },
        },
        mate: { select: { name: true } },
      },
    });

    return members.map((m) =>
      this.toGroupMemberDto(
        m,
        m.student.excusesAsStudent[0]?.expiresAt.toISOString() as GroupMemberDto['activeExcuseExpiresAt']
      )
    );
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Resolves week number + start/end dates for a new schedule image upload.
   * - First week: requires saturdayDate (validated as Saturday).
   * - Subsequent weeks: next Saturday from last week's startDate, must be >= today.
   */
  private async resolveWeekForGroup(
    groupId: string,
    saturdayDate: ISODateOnlyString | undefined,
    tx: Parameters<Parameters<DatabaseService['$transaction']>[0]>[0]
  ): Promise<{ weekNumber: number; startDate: Date; endDate: Date }> {
    const lastWeek = await tx.week.findFirst({
      where: { groupId },
      orderBy: { weekNumber: 'desc' },
    });

    if (!lastWeek) {
      if (!saturdayDate) throw new BadRequestException('تاريخ السبت مطلوب للأسبوع الأول');
      if (!isSaturday(saturdayDate))
        throw new BadRequestException('يجب أن يكون تاريخ البداية يوم السبت');
      const endDateStr = addDaysToDateStr(saturdayDate, 5);
      return {
        weekNumber: 1,
        startDate: dateOnlyToUTC(saturdayDate),
        endDate: dateOnlyToUTC(endDateStr),
      };
    }

    const lastStartStr = formatDate({
      date: lastWeek.startDate,
      token: 'yyyy-MM-dd',
      timezone: 'utc',
    }) as ISODateOnlyString;
    const nextStartStr = getNextSaturdayFrom(lastStartStr);
    if (!isDateTodayOrFuture(nextStartStr))
      throw new BadRequestException('تاريخ الأسبوع التالي يجب أن يكون في المستقبل');
    const nextEndStr = addDaysToDateStr(nextStartStr, 5);

    return {
      weekNumber: lastWeek.weekNumber + 1,
      startDate: dateOnlyToUTC(nextStartStr),
      endDate: dateOnlyToUTC(nextEndStr),
    };
  }

  private toGroupDto(g: {
    id: string;
    name: string;
    timezone: string;
    status: string;
    description: string | null;
    awrad: unknown;
    moderatorId: string | null;
    createdAt: Date;
    moderator?: { name: string } | null;
    _count: { members: number; weeks: number };
  }): GroupDto {
    return {
      id: g.id,
      name: g.name,
      timezone: g.timezone,
      status: g.status as GroupDto['status'],
      description: g.description ?? undefined,
      awrad: (g.awrad as AwradType[]) ?? [],
      moderatorId: g.moderatorId ?? undefined,
      moderatorName: g.moderator?.name ?? undefined,
      memberCount: g._count.members,
      weekCount: g._count.weeks,
      createdAt: g.createdAt.toISOString() as GroupDto['createdAt'],
    };
  }

  private toWeekDto(w: {
    id: string;
    groupId: string;
    weekNumber: number;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    scheduleImage: {
      id: string;
      weekId: string;
      name: string;
      imageUrl: string;
      createdAt: Date;
    };
  }): WeekDto {
    return {
      id: w.id,
      groupId: w.groupId,
      weekNumber: w.weekNumber,
      startDate: formatDate({
        date: w.startDate,
        token: 'yyyy-MM-dd',
        timezone: 'utc',
      }) as ISODateOnlyString,
      endDate: formatDate({
        date: w.endDate,
        token: 'yyyy-MM-dd',
        timezone: 'utc',
      }) as ISODateOnlyString,
      createdAt: w.createdAt.toISOString() as WeekDto['createdAt'],
      scheduleImage: {
        id: w.scheduleImage.id,
        weekId: w.scheduleImage.weekId,
        name: w.scheduleImage.name,
        imageUrl: w.scheduleImage.imageUrl,
        createdAt: w.scheduleImage.createdAt.toISOString() as WeekDto['createdAt'],
      },
    };
  }

  private toGroupMemberDto(
    m: {
      id: string;
      groupId: string;
      studentId: string;
      mateId: string | null;
      status: string;
      joinedAt: Date;
      student: {
        name: string;
        username: string;
        timezone: string;
        notes: string | null;
        excusesAsStudent?: { expiresAt: Date }[];
      };
      mate: { name: string } | null;
    },
    activeExcuseExpiresAt: GroupMemberDto['activeExcuseExpiresAt']
  ): GroupMemberDto {
    return {
      id: m.id,
      groupId: m.groupId,
      studentId: m.studentId,
      studentName: m.student.name,
      studentUsername: m.student.username,
      studentTimezone: m.student.timezone,
      mateId: m.mateId ?? undefined,
      mateName: m.mate?.name ?? undefined,
      notes: m.student.notes ?? undefined,
      status: m.status as 'ACTIVE' | 'INACTIVE',
      joinedAt: m.joinedAt.toISOString() as GroupMemberDto['joinedAt'],
      activeExcuseExpiresAt,
    };
  }
}
