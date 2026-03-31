import type { ISODateString } from './types/api.types';

// ── Payload map — single source of truth ──────────────────────────
export type RequestPayloadMap = {
  EXCUSE: {
    groupId: string;
    expiresAt: ISODateString;
    reason: string;
  };
  ACTIVATION: {
    groupId: string;
  };
};

export type RequestType = keyof RequestPayloadMap;
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

// ── Create DTOs (sent by learner) ─────────────────────────────────
export interface CreateRequestDto<T extends RequestType = RequestType> {
  type: T;
  payload: RequestPayloadMap[T];
}

// ── Response DTO ───────────────────────────────────────────────────
export interface RequestDto<T extends RequestType = RequestType> {
  id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  type: T;
  payload: RequestPayloadMap[T];
  status: RequestStatus;
  reviewedBy?: string;
  reviewerName?: string;
  createdAt: ISODateString;
  reviewedAt?: ISODateString;
}

// ── Review action DTO ──────────────────────────────────────────────
export interface ReviewRequestDto {
  action: 'ACCEPT' | 'REJECT';
}

// ── Stats DTO ──────────────────────────────────────────────────────
export interface RequestStatsDto {
  pending: number;
  accepted: number;
  rejected: number;
  total: number;
}
