import { PrismaClient, UserRole } from 'generated/prisma/client';
import {
  addDaysToDateStr,
  combineDateTime,
  dateToISODateOnly,
  type ISODateOnlyString,
  type TimeMinutes,
} from '@wirdi/shared';

type UsernameMap = Record<string, { id: string; role: UserRole }>;
type WeekDayNumber = 6 | 0 | 1 | 2 | 3 | 4;
type MembershipStatus = 'ACTIVE' | 'INACTIVE';
type WirdSeedStatus = 'ATTENDED' | 'MISSED';

type MembershipSeed = {
  username: string;
  status?: MembershipStatus;
  mateUsername?: string;
  joinedOffsetDays?: number;
  removed?: boolean;
};

type SeedClockPoint = {
  offsetDays: number;
  hour: number;
  minute?: number;
};

type RecordingSeed = {
  dayNumber: WeekDayNumber;
  offsetDaysFromTarget?: number;
  hour: number;
  minute?: number;
  readOnMateUsername?: string;
};

type WirdEntrySeed = {
  dayNumber: WeekDayNumber;
  status: WirdSeedStatus;
  recordedAt: Date;
  readOnMateId?: string;
};

type AlertEntrySeed = {
  dayNumber: WeekDayNumber;
  createdAt: Date;
};

type SimulatedWeekInput = {
  weekStartDateStr: ISODateOnlyString;
  timezone: string;
  asOf: SeedClockPoint;
  recordings?: RecordingSeed[];
  activeExcuseUntil?: SeedClockPoint;
  previousWeekAlertCountForGrace?: number;
  joinedOffsetDays?: number;
  removed?: boolean;
  initialStatus?: MembershipStatus;
};

type SimulatedWeekResult = {
  wirds: WirdEntrySeed[];
  alerts: AlertEntrySeed[];
  finalStatus: MembershipStatus;
};

const WEEK_DAY_SEQUENCE: WeekDayNumber[] = [6, 0, 1, 2, 3, 4];
const CRON_HOUR = 16;
const DAY_OFFSET_BY_NUMBER: Record<WeekDayNumber, number> = {
  6: 0,
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
};

function toTimeMinutes(hour: number, minute = 0): TimeMinutes {
  return (hour * 60 + minute) as TimeMinutes;
}

function at(offsetDays: number, hour: number, minute = 0): SeedClockPoint {
  return { offsetDays, hour, minute };
}

function recordOn(
  dayNumber: WeekDayNumber,
  options?: {
    offsetDaysFromTarget?: number;
    hour?: number;
    minute?: number;
    readOnMateUsername?: string;
  }
): RecordingSeed {
  return {
    dayNumber,
    offsetDaysFromTarget: options?.offsetDaysFromTarget,
    hour: options?.hour ?? 10,
    minute: options?.minute ?? 0,
    readOnMateUsername: options?.readOnMateUsername,
  };
}

function getWeekAnchors() {
  const today = new Date();
  const dayOfWeek = today.getUTCDay();
  const daysToSubtract = dayOfWeek === 6 ? 0 : (dayOfWeek + 1) % 7;

  const currentSaturday = new Date(today);
  currentSaturday.setUTCDate(today.getUTCDate() - daysToSubtract);
  currentSaturday.setUTCHours(0, 0, 0, 0);

  const currentSaturdayStr = dateToISODateOnly(currentSaturday);
  const currentFridayStr = addDaysToDateStr(currentSaturdayStr, 6);

  const previousSaturday = new Date(currentSaturday);
  previousSaturday.setUTCDate(previousSaturday.getUTCDate() - 7);
  previousSaturday.setUTCHours(0, 0, 0, 0);

  const previousSaturdayStr = dateToISODateOnly(previousSaturday);
  const previousFridayStr = addDaysToDateStr(previousSaturdayStr, 6);

  return {
    currentSaturday,
    currentSaturdayStr,
    currentFridayStr,
    previousSaturday,
    previousSaturdayStr,
    previousFridayStr,
  };
}

function getDateAtPoint(
  weekStartDateStr: ISODateOnlyString,
  timezone: string,
  point: SeedClockPoint
): Date {
  const dateStr = addDaysToDateStr(weekStartDateStr, point.offsetDays);
  return new Date(combineDateTime(dateStr, toTimeMinutes(point.hour, point.minute ?? 0), timezone));
}

function getDayDateStr(
  weekStartDateStr: ISODateOnlyString,
  dayNumber: WeekDayNumber
): ISODateOnlyString {
  return addDaysToDateStr(weekStartDateStr, DAY_OFFSET_BY_NUMBER[dayNumber]);
}

function getDeadlineAt(
  weekStartDateStr: ISODateOnlyString,
  timezone: string,
  dayNumber: WeekDayNumber
): Date {
  const dayDateStr = getDayDateStr(weekStartDateStr, dayNumber);
  const deadlineDateStr = addDaysToDateStr(dayDateStr, dayNumber === 4 ? 2 : 1);
  return new Date(combineDateTime(deadlineDateStr, toTimeMinutes(CRON_HOUR), timezone));
}

function buildCronTimeline(weekStartDateStr: ISODateOnlyString, timezone: string) {
  return WEEK_DAY_SEQUENCE.map((dayNumber) => ({
    dayNumber,
    runAt: getDeadlineAt(weekStartDateStr, timezone, dayNumber),
  }));
}

function getEligibleDaySequence(joinedOffsetDays = 0): WeekDayNumber[] {
  return WEEK_DAY_SEQUENCE.filter(
    (dayNumber) => DAY_OFFSET_BY_NUMBER[dayNumber] >= joinedOffsetDays
  );
}

function canRecordDay(
  wirds: Map<WeekDayNumber, WirdEntrySeed>,
  eligibleDaySequence: WeekDayNumber[],
  dayNumber: WeekDayNumber
): boolean {
  const dayIndex = eligibleDaySequence.indexOf(dayNumber);
  if (dayIndex === -1) {
    return false;
  }

  return eligibleDaySequence
    .slice(0, dayIndex)
    .every((previousDayNumber) => wirds.get(previousDayNumber)?.status === 'ATTENDED');
}

function buildRecordingDate(
  weekStartDateStr: ISODateOnlyString,
  timezone: string,
  recording: RecordingSeed
): Date {
  const absoluteOffset =
    DAY_OFFSET_BY_NUMBER[recording.dayNumber] + (recording.offsetDaysFromTarget ?? 0);

  return getDateAtPoint(weekStartDateStr, timezone, {
    offsetDays: absoluteOffset,
    hour: recording.hour,
    minute: recording.minute,
  });
}

function simulateWeekPolicy(input: SimulatedWeekInput, users: UsernameMap): SimulatedWeekResult {
  const asOf = getDateAtPoint(input.weekStartDateStr, input.timezone, input.asOf);
  const activeExcuseUntil = input.activeExcuseUntil
    ? getDateAtPoint(input.weekStartDateStr, input.timezone, input.activeExcuseUntil)
    : null;
  const eligibleDaySequence = getEligibleDaySequence(input.joinedOffsetDays ?? 0);

  const wirds = new Map<WeekDayNumber, WirdEntrySeed>();
  const alerts = new Map<WeekDayNumber, AlertEntrySeed>();
  let finalStatus: MembershipStatus = input.initialStatus ?? 'ACTIVE';

  const recordingEvents = (input.recordings ?? [])
    .map((recording) => ({
      type: 'recording' as const,
      recording,
      at: buildRecordingDate(input.weekStartDateStr, input.timezone, recording),
    }))
    .filter((event) => event.at <= asOf);

  const cronEvents = buildCronTimeline(input.weekStartDateStr, input.timezone)
    .filter((event) => eligibleDaySequence.includes(event.dayNumber))
    .map((event) => ({ type: 'cron' as const, ...event }))
    .filter((event) => event.runAt <= asOf);

  const events = [...recordingEvents, ...cronEvents].sort((left, right) => {
    const leftAt = left.type === 'recording' ? left.at : left.runAt;
    const rightAt = right.type === 'recording' ? right.at : right.runAt;
    const timeDiff = leftAt.getTime() - rightAt.getTime();

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return left.type === 'recording' ? -1 : 1;
  });

  for (const event of events) {
    if (event.type === 'recording') {
      if (input.removed || finalStatus !== 'ACTIVE') {
        continue;
      }

      const deadlineAt = getDeadlineAt(
        input.weekStartDateStr,
        input.timezone,
        event.recording.dayNumber
      );
      if (event.at > deadlineAt) {
        continue;
      }

      if (!canRecordDay(wirds, eligibleDaySequence, event.recording.dayNumber)) {
        continue;
      }

      wirds.set(event.recording.dayNumber, {
        dayNumber: event.recording.dayNumber,
        status: 'ATTENDED',
        recordedAt: event.at,
        readOnMateId: event.recording.readOnMateUsername
          ? users[event.recording.readOnMateUsername]?.id
          : undefined,
      });

      continue;
    }

    if (input.removed || finalStatus !== 'ACTIVE') {
      continue;
    }

    const excuseIsActive = activeExcuseUntil ? activeExcuseUntil > event.runAt : false;

    if (!excuseIsActive && !wirds.has(event.dayNumber)) {
      wirds.set(event.dayNumber, {
        dayNumber: event.dayNumber,
        status: 'MISSED',
        recordedAt: event.runAt,
      });
      alerts.set(event.dayNumber, {
        dayNumber: event.dayNumber,
        createdAt: event.runAt,
      });

      if (alerts.size >= 3) {
        finalStatus = 'INACTIVE';
      }
    }

    if (
      event.dayNumber === 4 &&
      finalStatus === 'ACTIVE' &&
      !excuseIsActive &&
      (input.previousWeekAlertCountForGrace ?? 0) >= 1
    ) {
      finalStatus = 'INACTIVE';
    }
  }

  return {
    wirds: Array.from(wirds.values()).sort(
      (left, right) => DAY_OFFSET_BY_NUMBER[left.dayNumber] - DAY_OFFSET_BY_NUMBER[right.dayNumber]
    ),
    alerts: Array.from(alerts.values()).sort(
      (left, right) => DAY_OFFSET_BY_NUMBER[left.dayNumber] - DAY_OFFSET_BY_NUMBER[right.dayNumber]
    ),
    finalStatus,
  };
}

async function loadScenarioUsers(prisma: PrismaClient): Promise<UsernameMap> {
  const scenarioUsernames = [
    'admin',
    'moderator',
    'moderator2',
    ...Array.from({ length: 25 }, (_, i) => `student${i + 1}`),
  ];

  const users = await prisma.user.findMany({
    where: { username: { in: scenarioUsernames } },
    select: { id: true, username: true, role: true },
  });

  const byUsername: UsernameMap = {};
  for (const user of users) {
    byUsername[user.username] = { id: user.id, role: user.role };
  }

  const missing = scenarioUsernames.filter((username) => !byUsername[username]);
  if (missing.length > 0) {
    throw new Error(`Missing users for wird tracking seed: ${missing.join(', ')}`);
  }

  return byUsername;
}

async function createWeek(
  prisma: PrismaClient,
  input: {
    groupId: string;
    weekNumber: number;
    startDate: Date;
    endDateStr: string;
    scheduleName: string;
    imageUrl: string;
    imagekitFileId: string;
  }
) {
  return prisma.week.create({
    data: {
      groupId: input.groupId,
      weekNumber: input.weekNumber,
      startDate: input.startDate,
      endDate: new Date(input.endDateStr),
      scheduleImage: {
        create: {
          name: input.scheduleName,
          imageUrl: input.imageUrl,
          imagekitFileId: input.imagekitFileId,
        },
      },
    },
  });
}

async function createMemberships(
  prisma: PrismaClient,
  input: {
    groupId: string;
    members: MembershipSeed[];
    users: UsernameMap;
    joinedBaseDate: Date;
    actorId: string;
  }
) {
  for (const member of input.members) {
    const user = input.users[member.username];
    const mate = member.mateUsername ? input.users[member.mateUsername] : null;

    const joinedAt = new Date(input.joinedBaseDate);
    if (member.joinedOffsetDays) {
      joinedAt.setUTCDate(joinedAt.getUTCDate() + member.joinedOffsetDays);
    }

    await prisma.groupMember.create({
      data: {
        groupId: input.groupId,
        studentId: user.id,
        mateId: mate?.id ?? null,
        status: member.status ?? 'ACTIVE',
        joinedAt,
        removedAt: member.removed ? new Date() : null,
        removedBy: member.removed ? input.actorId : null,
      },
    });
  }
}

async function addWirds(
  prisma: PrismaClient,
  input: {
    weekId: string;
    userId: string;
    entries: WirdEntrySeed[];
  }
) {
  if (input.entries.length === 0) return;

  await prisma.studentWird.createMany({
    data: input.entries.map((entry) => ({
      studentId: input.userId,
      weekId: input.weekId,
      dayNumber: entry.dayNumber,
      status: entry.status,
      readOnMateId: entry.readOnMateId,
      recordedAt: entry.recordedAt,
    })),
  });
}

async function addAlerts(
  prisma: PrismaClient,
  input: {
    groupId: string;
    weekId: string;
    userId: string;
    entries: AlertEntrySeed[];
  }
) {
  if (input.entries.length === 0) return;

  await prisma.alert.createMany({
    data: input.entries.map((entry) => ({
      studentId: input.userId,
      groupId: input.groupId,
      weekId: input.weekId,
      dayNumber: entry.dayNumber,
      createdAt: entry.createdAt,
    })),
  });
}

async function applyWeekSimulation(
  prisma: PrismaClient,
  input: {
    groupId: string;
    weekId: string;
    userId: string;
    users: UsernameMap;
    weekStartDateStr: ISODateOnlyString;
    timezone: string;
    asOf: SeedClockPoint;
    recordings?: RecordingSeed[];
    activeExcuseUntil?: SeedClockPoint;
    previousWeekAlertCountForGrace?: number;
    joinedOffsetDays?: number;
    removed?: boolean;
    initialStatus?: MembershipStatus;
  }
) {
  const simulation = simulateWeekPolicy(
    {
      weekStartDateStr: input.weekStartDateStr,
      timezone: input.timezone,
      asOf: input.asOf,
      recordings: input.recordings,
      activeExcuseUntil: input.activeExcuseUntil,
      previousWeekAlertCountForGrace: input.previousWeekAlertCountForGrace,
      joinedOffsetDays: input.joinedOffsetDays,
      removed: input.removed,
      initialStatus: input.initialStatus,
    },
    input.users
  );

  await addWirds(prisma, {
    weekId: input.weekId,
    userId: input.userId,
    entries: simulation.wirds,
  });

  await addAlerts(prisma, {
    groupId: input.groupId,
    weekId: input.weekId,
    userId: input.userId,
    entries: simulation.alerts,
  });

  if (simulation.finalStatus === 'INACTIVE') {
    await prisma.groupMember.update({
      where: {
        groupId_studentId: {
          groupId: input.groupId,
          studentId: input.userId,
        },
      },
      data: { status: 'INACTIVE' },
    });
  }
}

function createAttendedEntries(
  weekStartDateStr: ISODateOnlyString,
  timezone: string,
  days: WeekDayNumber[]
): WirdEntrySeed[] {
  return days.map((dayNumber) => ({
    dayNumber,
    status: 'ATTENDED',
    recordedAt: getDateAtPoint(weekStartDateStr, timezone, {
      offsetDays: DAY_OFFSET_BY_NUMBER[dayNumber],
      hour: 10,
    }),
  }));
}

export async function seedWirdTracking(prisma: PrismaClient) {
  console.log('🌱 Seeding wird tracking scenarios...');

  const users = await loadScenarioUsers(prisma);
  const adminId = users['admin'].id;
  const moderatorId = users['moderator'].id;
  const anchors = getWeekAnchors();
  const groupTimezone = 'Asia/Riyadh';

  const mainGroup = await prisma.group.create({
    data: {
      name: 'حلقة الاختبار',
      timezone: groupTimezone,
      moderatorId,
      status: 'ACTIVE',
      awrad: ['حفظ', 'مراجعة', 'تلاوة'],
      description: 'حلقة لاختبار سياسات التتبع',
    },
  });

  const historicalGroup = await prisma.group.create({
    data: {
      name: 'حلقة سابقة',
      timezone: groupTimezone,
      moderatorId,
      status: 'ACTIVE',
      awrad: ['حفظ', 'مراجعة'],
      description: 'مجموعة لاختبار عرض المجموعات السابقة',
    },
  });

  const currentWeek = await createWeek(prisma, {
    groupId: mainGroup.id,
    weekNumber: 1,
    startDate: anchors.currentSaturday,
    endDateStr: anchors.currentFridayStr,
    scheduleName: 'جدول الأسبوع الحالي',
    imageUrl: 'https://example.com/schedule-current.jpg',
    imagekitFileId: 'schedule-current',
  });

  const previousWeek = await createWeek(prisma, {
    groupId: mainGroup.id,
    weekNumber: 0,
    startDate: anchors.previousSaturday,
    endDateStr: anchors.previousFridayStr,
    scheduleName: 'جدول الأسبوع السابق',
    imageUrl: 'https://example.com/schedule-previous.jpg',
    imagekitFileId: 'schedule-previous',
  });

  const historicalWeek = await createWeek(prisma, {
    groupId: historicalGroup.id,
    weekNumber: 1,
    startDate: anchors.currentSaturday,
    endDateStr: anchors.currentFridayStr,
    scheduleName: 'جدول مجموعة سابقة',
    imageUrl: 'https://example.com/schedule-history.jpg',
    imagekitFileId: 'schedule-history',
  });

  await createMemberships(prisma, {
    groupId: mainGroup.id,
    users,
    joinedBaseDate: anchors.currentSaturday,
    actorId: adminId,
    members: [
      { username: 'student1', mateUsername: 'student2' },
      { username: 'student2', mateUsername: 'student1' },
      { username: 'student3' },
      { username: 'student4' },
      { username: 'student5' },
      { username: 'student6' },
      { username: 'student7', joinedOffsetDays: 2 },
      { username: 'student8', mateUsername: 'student9' },
      { username: 'student9' },
      { username: 'student10', status: 'INACTIVE' },
      { username: 'admin' },
      { username: 'moderator' },
      { username: 'student15' },
      { username: 'student16' },
      { username: 'student17' },
      { username: 'student18', removed: true, mateUsername: 'student8' },
      { username: 'student19', status: 'INACTIVE' },
      { username: 'student20', removed: true },
      { username: 'student21', removed: true },
      { username: 'student22' },
      { username: 'student23', removed: true },
      { username: 'student24', status: 'INACTIVE' },
      { username: 'student25' },
      { username: 'student14', removed: true },
    ],
  });

  await createMemberships(prisma, {
    groupId: historicalGroup.id,
    users,
    joinedBaseDate: anchors.currentSaturday,
    actorId: adminId,
    members: [
      { username: 'student25', removed: true },
      { username: 'student14', removed: true },
      { username: 'student11' },
      { username: 'student12' },
      { username: 'student13' },
    ],
  });

  await prisma.excuse.create({
    data: {
      studentId: users['student4'].id,
      groupId: mainGroup.id,
      createdBy: adminId,
      expiresAt: getDateAtPoint(anchors.currentSaturdayStr, groupTimezone, at(7, 0)),
    },
  });

  await prisma.excuse.create({
    data: {
      studentId: users['student10'].id,
      groupId: mainGroup.id,
      createdBy: adminId,
      expiresAt: getDateAtPoint(anchors.currentSaturdayStr, groupTimezone, at(3, 23)),
    },
  });

  await prisma.excuse.create({
    data: {
      studentId: users['student20'].id,
      groupId: mainGroup.id,
      createdBy: adminId,
      expiresAt: getDateAtPoint(anchors.currentSaturdayStr, groupTimezone, at(10, 0)),
    },
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student1'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(5, 12),
    recordings: [recordOn(6), recordOn(0), recordOn(1), recordOn(2)],
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student2'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(3, 12),
    recordings: [recordOn(6)],
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student3'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(3, 17),
    recordings: [recordOn(6)],
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student4'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(4, 17),
    recordings: [recordOn(6)],
    activeExcuseUntil: at(7, 0),
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student5'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(4, 17),
    recordings: [recordOn(6)],
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: previousWeek.id,
    userId: users['student6'].id,
    users,
    weekStartDateStr: anchors.previousSaturdayStr,
    timezone: groupTimezone,
    asOf: at(2, 17),
    recordings: [recordOn(6)],
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student6'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(7, 17),
    recordings: [recordOn(6), recordOn(0), recordOn(1), recordOn(2), recordOn(3), recordOn(4)],
    previousWeekAlertCountForGrace: 1,
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student7'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(4, 12),
    joinedOffsetDays: 2,
    recordings: [recordOn(1), recordOn(2)],
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student8'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(3, 12),
    recordings: [recordOn(6, { readOnMateUsername: 'student9' })],
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student9'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(6, 12),
    recordings: [recordOn(6), recordOn(0), recordOn(1), recordOn(2), recordOn(3)],
  });

  await addWirds(prisma, {
    weekId: currentWeek.id,
    userId: users['student10'].id,
    entries: createAttendedEntries(anchors.currentSaturdayStr, groupTimezone, [6, 0]),
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['admin'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(2, 12),
    recordings: [recordOn(6), recordOn(0)],
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['moderator'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(2, 12),
    recordings: [recordOn(6)],
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student15'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(1, 17),
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student16'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(0, 12),
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student17'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(6, 12),
    recordings: [recordOn(6), recordOn(0), recordOn(1), recordOn(2), recordOn(3)],
  });

  await addWirds(prisma, {
    weekId: currentWeek.id,
    userId: users['student14'].id,
    entries: createAttendedEntries(anchors.currentSaturdayStr, groupTimezone, [6, 0]),
  });

  await addWirds(prisma, {
    weekId: currentWeek.id,
    userId: users['student20'].id,
    entries: createAttendedEntries(anchors.currentSaturdayStr, groupTimezone, [6]),
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student21'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(4, 17),
    removed: true,
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student22'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(3, 17),
    recordings: [recordOn(6)],
  });

  await addWirds(prisma, {
    weekId: currentWeek.id,
    userId: users['student23'].id,
    entries: createAttendedEntries(anchors.currentSaturdayStr, groupTimezone, [6]),
  });

  await addWirds(prisma, {
    weekId: currentWeek.id,
    userId: users['student24'].id,
    entries: createAttendedEntries(anchors.currentSaturdayStr, groupTimezone, [6]),
  });

  await applyWeekSimulation(prisma, {
    groupId: mainGroup.id,
    weekId: currentWeek.id,
    userId: users['student25'].id,
    users,
    weekStartDateStr: anchors.currentSaturdayStr,
    timezone: groupTimezone,
    asOf: at(2, 12),
    recordings: [recordOn(6), recordOn(0)],
  });

  await addWirds(prisma, {
    weekId: historicalWeek.id,
    userId: users['student25'].id,
    entries: createAttendedEntries(anchors.currentSaturdayStr, groupTimezone, [6]),
  });

  await addWirds(prisma, {
    weekId: historicalWeek.id,
    userId: users['student14'].id,
    entries: createAttendedEntries(anchors.currentSaturdayStr, groupTimezone, [6]),
  });

  console.log('✅ Wird tracking scenarios seeded');
  console.log(`📊 Main group: ${mainGroup.name}`);
  console.log(`📊 Historical group: ${historicalGroup.name}`);
  console.log(`📅 Current week: ${anchors.currentSaturdayStr} -> ${anchors.currentFridayStr}`);
  console.log('🧪 Covered users: admin, moderator, student1 .. student25');
}
