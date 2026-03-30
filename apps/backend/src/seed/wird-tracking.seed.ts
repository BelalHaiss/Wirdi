import { PrismaClient } from 'generated/prisma/client';
import { addDaysToDateStr, dateToISODateOnly } from '@wirdi/shared';

/**
 * Seeds complete wird tracking scenario for testing cron job and policies
 */
export async function seedWirdTracking(prisma: PrismaClient) {
  console.log('🌱 Seeding wird tracking data...');

  // Get admin, moderator, and students explicitly by role
  const [admin, moderator, students] = await Promise.all([
    prisma.user.findFirst({ where: { role: 'ADMIN' } }),
    prisma.user.findFirst({ where: { role: 'MODERATOR' } }),
    prisma.user.findMany({ where: { role: 'STUDENT' }, take: 10 }),
  ]);

  if (!admin || !moderator || students.length < 10) {
    throw new Error('Not enough users. Run main seed first.');
  }

  // Create test group
  const group = await prisma.group.create({
    data: {
      name: 'حلقة الاختبار',
      timezone: 'Asia/Riyadh',
      moderatorId: moderator.id,
      status: 'ACTIVE',
      awrad: ['حفظ', 'مراجعة', 'تلاوة'],
      description: 'حلقة لاختبار سياسات التتبع',
    },
  });

  // Get last Saturday (start of current week)
  const today = new Date();
  const dayOfWeek = today.getUTCDay();
  const daysToSubtract = dayOfWeek === 6 ? 0 : (dayOfWeek + 1) % 7;
  const lastSaturday = new Date(today);
  lastSaturday.setUTCDate(today.getUTCDate() - daysToSubtract);
  lastSaturday.setUTCHours(0, 0, 0, 0);

  const saturdayStr = dateToISODateOnly(lastSaturday);
  const fridayStr = addDaysToDateStr(saturdayStr, 6);

  // Create current week
  const week = await prisma.week.create({
    data: {
      groupId: group.id,
      weekNumber: 1,
      startDate: lastSaturday,
      endDate: new Date(fridayStr),
      scheduleImage: {
        create: {
          name: 'جدول الأسبوع الأول',
          imageUrl: 'https://example.com/schedule.jpg',
          imagekitFileId: 'test-file-id',
        },
      },
    },
  });

  // Create previous week for grace period testing
  const prevSaturday = new Date(lastSaturday);
  prevSaturday.setUTCDate(lastSaturday.getUTCDate() - 7);
  const prevFriday = new Date(prevSaturday);
  prevFriday.setUTCDate(prevSaturday.getUTCDate() + 6);

  const prevWeek = await prisma.week.create({
    data: {
      groupId: group.id,
      weekNumber: 0,
      startDate: prevSaturday,
      endDate: prevFriday,
      scheduleImage: {
        create: {
          name: 'جدول الأسبوع السابق',
          imageUrl: 'https://example.com/schedule-prev.jpg',
          imagekitFileId: 'test-file-id-prev',
        },
      },
    },
  });

  // Assign students to group with different scenarios
  const memberData = [
    // Student 1: Perfect attendance (all ATTENDED)
    { studentId: students[0].id, mateId: students[1].id, scenario: 'perfect' },

    // Student 2: Has 1 LATE record with existing alert (yellow cancels red)
    { studentId: students[1].id, mateId: students[0].id, scenario: 'late_cancels_alert' },

    // Student 3: Will miss Sunday (cron will create MISSED + alert)
    { studentId: students[2].id, mateId: null, scenario: 'will_miss_sunday' },

    // Student 4: Has active excuse (should skip alert creation)
    { studentId: students[3].id, mateId: null, scenario: 'has_excuse' },

    // Student 5: 2 alerts this week (will get 3rd and deactivate immediately)
    { studentId: students[4].id, mateId: null, scenario: 'three_alerts' },

    // Student 6: 1 alert in previous week (grace period deactivation on Saturday)
    { studentId: students[5].id, mateId: null, scenario: 'grace_period' },

    // Student 7: Mid-week join (joined Monday, no need to record Saturday/Sunday)
    { studentId: students[6].id, mateId: null, scenario: 'mid_week_join' },

    // Student 8: Mixed status (ATTENDED, LATE, will have MISSED)
    { studentId: students[7].id, mateId: students[8].id, scenario: 'mixed' },

    // Student 9: Thursday special case (can record late until Saturday 4 PM)
    { studentId: students[8].id, mateId: null, scenario: 'thursday_special' },
  ];

  // Create group members
  const joinDate = new Date(lastSaturday);
  for (const member of memberData) {
    const joinedAt =
      member.scenario === 'mid_week_join'
        ? new Date(addDaysToDateStr(saturdayStr, 2)) // Joined Monday
        : joinDate;

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        studentId: member.studentId,
        mateId: member.mateId,
        status: 'ACTIVE',
        joinedAt,
      },
    });
  }

  // Seed wird records based on scenarios
  const now = new Date();

  // Student 1: Perfect (Sat=6, Sun=0, Mon=1, Tue=2)
  await prisma.studentWird.createMany({
    data: [
      {
        studentId: students[0].id,
        weekId: week.id,
        dayNumber: 6,
        status: 'ATTENDED',
        recordedAt: now,
      },
      {
        studentId: students[0].id,
        weekId: week.id,
        dayNumber: 0,
        status: 'ATTENDED',
        recordedAt: now,
      },
      {
        studentId: students[0].id,
        weekId: week.id,
        dayNumber: 1,
        status: 'ATTENDED',
        recordedAt: now,
      },
      {
        studentId: students[0].id,
        weekId: week.id,
        dayNumber: 2,
        status: 'ATTENDED',
        recordedAt: now,
      },
    ],
  });

  // Student 2: Has LATE that should cancel existing alert (yellow cancels red)
  await prisma.studentWird.createMany({
    data: [
      {
        studentId: students[1].id,
        weekId: week.id,
        dayNumber: 6,
        status: 'ATTENDED',
        recordedAt: now,
      },
      // Sunday was MISSED first (alert created), then recorded LATE (alert should be deleted by recordLearnerWird)
      { studentId: students[1].id, weekId: week.id, dayNumber: 0, status: 'LATE', recordedAt: now },
      {
        studentId: students[1].id,
        weekId: week.id,
        dayNumber: 1,
        status: 'ATTENDED',
        recordedAt: now,
      },
    ],
  });
  // Create alert for day 0 (this should be deleted when LATE is recorded via API)
  await prisma.alert.create({
    data: { studentId: students[1].id, groupId: group.id, weekId: week.id, dayNumber: 0 },
  });

  // Student 3: Recorded Saturday only (Sunday will be MISSED by cron)
  await prisma.studentWird.create({
    data: {
      studentId: students[2].id,
      weekId: week.id,
      dayNumber: 6,
      status: 'ATTENDED',
      recordedAt: now,
    },
  });

  // Student 4: Has excuse + recorded Saturday
  await prisma.studentWird.create({
    data: {
      studentId: students[3].id,
      weekId: week.id,
      dayNumber: 6,
      status: 'ATTENDED',
      recordedAt: now,
    },
  });
  const futureExpiryDate = new Date();
  futureExpiryDate.setDate(futureExpiryDate.getDate() + 7);
  await prisma.excuse.create({
    data: {
      studentId: students[3].id,
      groupId: group.id,
      createdBy: admin.id,
      expiresAt: futureExpiryDate,
    },
  });

  // Student 5: Will have 3 alerts (2 existing + 1 from cron)
  await prisma.studentWird.create({
    data: {
      studentId: students[4].id,
      weekId: week.id,
      dayNumber: 6,
      status: 'ATTENDED',
      recordedAt: now,
    },
  });
  // Create 2 existing alerts
  await prisma.alert.createMany({
    data: [
      { studentId: students[4].id, groupId: group.id, weekId: week.id, dayNumber: 0 },
      { studentId: students[4].id, groupId: group.id, weekId: week.id, dayNumber: 1 },
    ],
  });
  // Create corresponding MISSED records
  await prisma.studentWird.createMany({
    data: [
      {
        studentId: students[4].id,
        weekId: week.id,
        dayNumber: 0,
        status: 'MISSED',
        recordedAt: now,
      },
      {
        studentId: students[4].id,
        weekId: week.id,
        dayNumber: 1,
        status: 'MISSED',
        recordedAt: now,
      },
    ],
  });

  // Student 6: 1 alert in previous week (grace period test)
  await prisma.studentWird.createMany({
    data: [
      {
        studentId: students[5].id,
        weekId: prevWeek.id,
        dayNumber: 6,
        status: 'ATTENDED',
        recordedAt: now,
      },
      {
        studentId: students[5].id,
        weekId: prevWeek.id,
        dayNumber: 0,
        status: 'MISSED',
        recordedAt: now,
      },
    ],
  });
  await prisma.alert.create({
    data: { studentId: students[5].id, groupId: group.id, weekId: prevWeek.id, dayNumber: 0 },
  });
  // Current week all attended
  await prisma.studentWird.createMany({
    data: [
      {
        studentId: students[5].id,
        weekId: week.id,
        dayNumber: 6,
        status: 'ATTENDED',
        recordedAt: now,
      },
      {
        studentId: students[5].id,
        weekId: week.id,
        dayNumber: 0,
        status: 'ATTENDED',
        recordedAt: now,
      },
    ],
  });

  // Student 7: Mid-week join (Mon) - recorded Mon, Tue
  await prisma.studentWird.createMany({
    data: [
      {
        studentId: students[6].id,
        weekId: week.id,
        dayNumber: 1,
        status: 'ATTENDED',
        recordedAt: now,
      },
      {
        studentId: students[6].id,
        weekId: week.id,
        dayNumber: 2,
        status: 'ATTENDED',
        recordedAt: now,
      },
    ],
  });

  // Student 8: Mixed statuses
  await prisma.studentWird.createMany({
    data: [
      {
        studentId: students[7].id,
        weekId: week.id,
        dayNumber: 6,
        status: 'ATTENDED',
        recordedAt: now,
        readOnMateId: students[8].id,
      },
      { studentId: students[7].id, weekId: week.id, dayNumber: 0, status: 'LATE', recordedAt: now },
      {
        studentId: students[7].id,
        weekId: week.id,
        dayNumber: 1,
        status: 'ATTENDED',
        recordedAt: now,
      },
      // Day 2 will be MISSED by cron
    ],
  });

  // Student 9: Thursday special case - recorded all days including Thursday
  // This tests that Thursday deadline extends to Saturday 4 PM (not Friday)
  await prisma.studentWird.createMany({
    data: [
      {
        studentId: students[8].id,
        weekId: week.id,
        dayNumber: 6,
        status: 'ATTENDED',
        recordedAt: now,
      },
      {
        studentId: students[8].id,
        weekId: week.id,
        dayNumber: 0,
        status: 'ATTENDED',
        recordedAt: now,
      },
      {
        studentId: students[8].id,
        weekId: week.id,
        dayNumber: 1,
        status: 'ATTENDED',
        recordedAt: now,
      },
      {
        studentId: students[8].id,
        weekId: week.id,
        dayNumber: 2,
        status: 'ATTENDED',
        recordedAt: now,
      },
      {
        studentId: students[8].id,
        weekId: week.id,
        dayNumber: 3,
        status: 'ATTENDED',
        recordedAt: now,
      },
      // Thursday (day 4) not recorded yet - can be recorded late until Saturday 4 PM
      // To test: Try recording day 4 on Friday/Saturday before 4 PM (should work)
    ],
  });

  console.log('✅ Wird tracking data seeded!');
  console.log(`📊 Group: ${group.name} (ID: ${group.id})`);
  console.log(`📅 Current Week: ${week.weekNumber} (${saturdayStr} to ${fridayStr})`);
  console.log(`👥 Assigned ${memberData.length} students with different scenarios`);
}
