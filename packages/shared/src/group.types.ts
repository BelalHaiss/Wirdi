import type { ISODateOnlyString, ISODateString } from './types/api.types';

// ============================================================================
// Enums
// ============================================================================

export type GroupStatus = 'ACTIVE' | 'INACTIVE';
export type AwradType = string;

// ============================================================================
// Group DTOs
// ============================================================================

export interface GroupDto {
  id: string;
  name: string;
  timezone: string;
  status: GroupStatus;
  description?: string;
  awrad: AwradType[];
  moderatorId?: string;
  moderatorName?: string;
  memberCount: number;
  weekCount: number;
  createdAt: ISODateString;
}

export interface CreateGroupDto {
  name: string;
  timezone: string;
  status?: GroupStatus;
  description?: string;
  awrad: AwradType[];
  moderatorId?: string;
}

export interface UpdateGroupDto {
  name?: string;
  timezone?: string;
  status?: GroupStatus;
  description?: string;
  awrad?: AwradType[];
  moderatorId?: string;
}

export type QueryGroupsResponseDto = GroupDto[];

export interface GroupStatsDto {
  groupsCount: number;
  learnersCount: number;
  moderatorsCount: number;
}

// ============================================================================
// Week & Schedule DTOs
// ============================================================================

export interface ScheduleImageDto {
  id: string;
  weekId: string;
  name: string;
  imageUrl: string;
  createdAt: ISODateString;
}

export interface WeekDto {
  id: string;
  groupId: string;
  weekNumber: number;
  startDate: ISODateOnlyString;
  endDate: ISODateOnlyString;
  createdAt: ISODateString;
  /** Every week is created by uploading a schedule image — always present */
  scheduleImage: ScheduleImageDto;
}

/** DTO for uploading a new week schedule image — groupId comes from the route param */
export interface CreateWeekScheduleDto {
  /** Required only for the first week — must be a Saturday (ISO date only: YYYY-MM-DD) */
  saturdayDate?: ISODateOnlyString;
  scheduleName: string;
}

/** DTO for updating a schedule image — file is handled separately via multipart */
export interface UpdateScheduleImageDto {
  /** Optional new display name for the schedule image */
  name?: string;
}

// ============================================================================
// Group Member DTOs
// ============================================================================

export interface GroupMemberDto {
  id: string;
  groupId: string;
  studentId: string;
  studentName: string;
  studentUsername: string;
  studentTimezone: string;
  mateId?: string;
  mateName?: string;
  notes?: string;
  joinedAt: ISODateString;
  /** ISO datetime of the active excuse expiry, undefined if no active excuse */
  activeExcuseExpiresAt?: ISODateString;
}

/** Assign multiple existing learners to a group at once */
export interface AssignLearnersToGroupDto {
  groupId: string;
  studentIds: string[];
}

/** Create new learners and assign them to a group in one shot */
export interface CreateAndAssignLearnersDto {
  groupId: string;
  learners: {
    name: string;
    username: string;
    timezone: string;
    notes?: string;
  }[];
}

/** Update the mate (زميل) for a group member */
export interface UpdateMemberMateDto {
  /** Pass null to remove the mate */
  mateId: string | null;
}

// ============================================================================
// Excuse DTOs
// ============================================================================

export interface ExcuseDto {
  id: string;
  studentId: string;
  groupId: string;
  createdBy: string;
  requestId?: string;
  expiresAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateExcuseDto {
  studentId: string;
  groupId: string;
  expiresAt: ISODateString;
  requestId?: string;
}

// ============================================================================
// StudentWird / Tracking DTOs
// ============================================================================

/** Values stored in the DB — what was actually recorded for a day. */
export type RecordedWirdStatus = 'ATTENDED' | 'MISSED' | 'LATE';

/**
 * Full display state for a day cell.
 * ATTENDED / MISSED / LATE — recorded values from the DB.
 * EMPTY — day is in the past/today but not yet recorded.
 * FUTURE — day has not arrived yet.
 * Always resolved by the backend; client never needs date math.
 */
export type WirdStatus = RecordedWirdStatus | 'FUTURE' | 'EMPTY';

/**
 * One day slot within a week for a specific student.
 * `wirdStatus` is the fully resolved display state — computed by the backend.
 * `dayNumber` uses JS native convention: 0=Sun, 1=Mon … 6=Sat (5=Fri is never used).
 */
export interface DayWirdDto {
  dayNumber: number;
  /** Resolved display state — backend-computed, ready to render directly */
  wirdStatus: WirdStatus;
  readOnMateId?: string;
  readOnMateName?: string;
  recordedAt?: ISODateString;
}

/**
 * One row in the tracking table.
 * `days` is always 6 items ordered for Arabic display: Sat(6)→Sun(0)→Mon(1)→Tue(2)→Wed(3)→Thu(4).
 * The client can iterate `days` directly in order — no day-number math needed.
 */
export interface GroupWirdTrackingRowDto {
  memberId: string;
  studentId: string;
  studentName: string;
  days: DayWirdDto[];
  /** Number of alerts for this student in the selected week */
  weekAlertCount: number;
  /** Total alerts for this student across all weeks of this group */
  totalAlertCount: number;
  /** ISO datetime of the active excuse expiry, undefined if no active excuse */
  activeExcuseExpiresAt?: ISODateString;
}

/** Full tracking grid for a single week */
export interface GroupWirdTrackingDto {
  weekId: string;
  rows: GroupWirdTrackingRowDto[];
}

/** Week with isCurrent/isUpcoming flags — used for learner views */
export interface WeekStatusFlagsDto extends WeekDto {
  /** true when today falls within startDate..endDate (inclusive) */
  isCurrent: boolean;
  /** true when startDate > today — week has not started yet */
  isUpcoming: boolean;
}

/** Week with flags set by the backend — no date math needed on the client */
export interface WeekWithCurrentFlagDto extends WeekStatusFlagsDto {
  /** true when this week is the recommended default tab (current week, or last past week if no current) */
  isDefault: boolean;
}

// ============================================================================
// Manual Attendance Edit DTOs
// ============================================================================

/** One day slot returned for admin attendance editing. */
export interface StudentDayWird {
  dayNumber: number;
  /** Recorded DB value — null when no record exists for this day */
  recordedStatus: RecordedWirdStatus | null;
  /** true when this day is in the future and cannot be edited */
  isBlocked: boolean;
}

/** Response for fetching all days of a student in a specific week */
export interface StudentWeekWirdsDto {
  studentId: string;
  weekId: string;
  days: StudentDayWird[];
}

/** A single day update for manual attendance override */
export interface UpdateStudentWirdDayDto {
  dayNumber: number;
  status: 'ATTENDED' | 'MISSED';
}

/** Payload for PATCH /student-wird/student/:studentId/week/:weekId */
export interface UpdateStudentWirdsDto {
  updates: UpdateStudentWirdDayDto[];
}

// ============================================================================
// Learner Self-Recording DTOs
// ============================================================================

/**
 * The day the learner is currently allowed to record.
 * `available` — there is one recordable day within the allowed time window.
 * `none` — all days are recorded, or no days are within the window yet.
 */
export type RecordableDayStatus =
  | { status: 'available'; dayNumber: number; isLate: boolean }
  | { status: 'none'; reason: 'all_recorded' | 'upcoming' };

/** Response for GET /student-wird/my-group/:groupId/overview */
export interface LearnerGroupOverviewDto {
  week: WeekStatusFlagsDto;
  myRow: GroupWirdTrackingRowDto;
  myMembership: GroupMemberDto;
  recordableDay: RecordableDayStatus;
}

/** Payload for POST /student-wird/my-wird */
export interface RecordLearnerWirdDto {
  groupId: string;
  weekId: string;
  dayNumber: number;
  /** Mate the learner read upon. null = no mate. Omit to keep the default from GroupMember. */
  mateId?: string | null;
}
