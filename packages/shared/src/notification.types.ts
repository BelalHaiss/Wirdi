import type { RequestType, RequestStatus } from './request.types';

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
  LEARNER_REMOVED: {
    studentId: string;
    studentName: string;
    groupId: string;
    groupName: string;
  };
  REQUEST_CREATED: {
    requestId: string;
    requestType: RequestType;
    studentName: string;
    groupName: string;
    groupId: string;
  };
  REQUEST_UPDATED: {
    requestId: string;
    requestType: RequestType;
    groupName: string;
    groupId: string;
    status: RequestStatus;
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
    LEARNER_REMOVED: ['IN_APP'],
    REQUEST_CREATED: ['IN_APP'],
    REQUEST_UPDATED: ['IN_APP'],
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
