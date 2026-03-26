// ── Payload map — single source of truth ──────────────────────────
export type NotificationPayloadMap = {
  ALERT_ASSIGNED: {
    groupId: string;
    groupName: string;
    weekId: string;
    weekNumber: number;
    dayNumber: number;
  };
  LEARNER_DEACTIVATED: {
    studentId: string;
    studentName: string;
    groupId: string;
    groupName: string;
  };
};

export type NotificationType = keyof NotificationPayloadMap;

// ── Channel types ─────────────────────────────────────────────────
export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL';

// Each type declares exactly which channels it uses
export const NOTIFICATION_CHANNEL_CONFIG: Record<NotificationType, readonly NotificationChannel[]> =
  {
    ALERT_ASSIGNED: ['IN_APP'],
    LEARNER_DEACTIVATED: ['IN_APP'],
    // future examples:
    // REQUEST_APPROVED: ['IN_APP', 'PUSH'],
    // WEEKLY_REPORT: ['EMAIL'],
  } as const;

// ── Send contract used by every caller ────────────────────────────
export interface SendNotificationDto<T extends NotificationType = NotificationType> {
  type: T;
  recipientId: string;
  payload: NotificationPayloadMap[T];
}

// ── Read DTOs ──────────────────────────────────────────────────────
export interface NotificationDto<T extends NotificationType = NotificationType> {
  id: string;
  recipientId: string;
  type: T;
  payload: NotificationPayloadMap[T];
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCountDto {
  count: number;
}
