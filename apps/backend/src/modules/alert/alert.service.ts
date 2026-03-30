import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';
import { SideEffectsQueue } from '../../utils/side-effects.util';
import type { Prisma } from 'generated/prisma/client';

@Injectable()
export class AlertService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Creates an alert for a missed day. Unique constraint on (studentId, weekId, dayNumber)
   * prevents duplicate alerts. Queues ALERT_ASSIGNED notification to learner.
   */
  async createAlert(
    tx: Prisma.TransactionClient,
    studentId: string,
    groupId: string,
    weekId: string,
    dayNumber: number,
    sideEffects: SideEffectsQueue
  ): Promise<void> {
    await tx.alert.create({
      data: { studentId, groupId, weekId, dayNumber },
    });

    // Fetch group and week details for notification payload
    const [group, week] = await Promise.all([
      tx.group.findUnique({ where: { id: groupId }, select: { name: true } }),
      tx.week.findUnique({ where: { id: weekId }, select: { weekNumber: true } }),
    ]);

    // Queue notification (sent after transaction)
    if (group && week) {
      sideEffects.add(() =>
        this.notificationService.send({
          type: 'ALERT_ASSIGNED',
          recipientId: studentId,
          payload: {
            groupId,
            groupName: group.name,
            weekId,
            weekNumber: week.weekNumber,
            dayNumber,
          },
        })
      );
    }
  }

  /**
   * Count alerts for a specific student in a specific week.
   */
  async getWeekAlertCount(studentId: string, weekId: string): Promise<number> {
    return this.db.alert.count({
      where: { studentId, weekId },
    });
  }

  /**
   * Count the number of distinct weeks where the student has at least one alert.
   */
  async countWeeksWithAlerts(studentId: string, groupId: string): Promise<number> {
    const result = await this.db.alert.groupBy({
      by: ['weekId'],
      where: { studentId, groupId },
      _count: { weekId: true },
    });
    return result.length;
  }

  /**
   * Delete a specific alert when a late record is submitted (yellow cancels red).
   */
  async deleteWeekDayAlert(studentId: string, weekId: string, dayNumber: number): Promise<void> {
    await this.db.alert.deleteMany({
      where: { studentId, weekId, dayNumber },
    });
  }

  /**
   * Check for immediate deactivation threshold (>= 3 alerts in current week).
   * Called after every alert creation.
   * Returns true if deactivation occurred.
   */
  async checkImmediateDeactivation(
    tx: Prisma.TransactionClient,
    studentId: string,
    groupId: string,
    weekId: string,
    sideEffects: SideEffectsQueue
  ): Promise<boolean> {
    const now = new Date();
    const activeExcuse = await tx.excuse.findFirst({
      where: { studentId, groupId, expiresAt: { gt: now } },
      select: { id: true },
    });
    if (activeExcuse) return false;

    const weekAlertCount = await tx.alert.count({ where: { studentId, weekId } });

    if (weekAlertCount >= 3) {
      await tx.groupMember.update({
        where: { groupId_studentId: { groupId, studentId } },
        data: { status: 'INACTIVE' },
      });

      // Queue deactivation notifications (sent after transaction)
      await this.queueDeactivationNotifications(studentId, groupId, sideEffects, tx);
      return true;
    }

    return false;
  }

  /**
   * Check for grace period deactivation (>= 1 alert in immediately previous week).
   * Called only on Saturday, checks the week that just ended.
   * Returns true if deactivation occurred.
   */
  async checkGracePeriodDeactivation(
    tx: Prisma.TransactionClient,
    studentId: string,
    groupId: string,
    previousWeekId: string,
    sideEffects: SideEffectsQueue
  ): Promise<boolean> {
    const now = new Date();
    const activeExcuse = await tx.excuse.findFirst({
      where: { studentId, groupId, expiresAt: { gt: now } },
      select: { id: true },
    });
    if (activeExcuse) return false;

    const prevWeekAlertCount = await tx.alert.count({
      where: { studentId, weekId: previousWeekId },
    });

    if (prevWeekAlertCount >= 1) {
      await tx.groupMember.update({
        where: { groupId_studentId: { groupId, studentId } },
        data: { status: 'INACTIVE' },
      });

      // Queue deactivation notifications (sent after transaction)
      await this.queueDeactivationNotifications(studentId, groupId, sideEffects, tx);
      return true;
    }

    return false;
  }

  /**
   * Queue deactivation notifications to all admins and the group moderator.
   */
  private async queueDeactivationNotifications(
    studentId: string,
    groupId: string,
    sideEffects: SideEffectsQueue,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const [student, group, admins] = await Promise.all([
      tx.user.findUnique({ where: { id: studentId }, select: { name: true } }),
      tx.group.findUnique({ where: { id: groupId }, select: { name: true, moderatorId: true } }),
      tx.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } }),
    ]);

    if (!student || !group) return;

    const payload = { studentId, studentName: student.name, groupId, groupName: group.name };
    const recipientIds = new Set<string>(admins.map((a) => a.id));
    if (group.moderatorId) recipientIds.add(group.moderatorId);

    // Queue notifications (sent after transaction)
    for (const recipientId of recipientIds) {
      sideEffects.add(() =>
        this.notificationService.send({ type: 'LEARNER_DEACTIVATED', recipientId, payload })
      );
    }
  }
}
