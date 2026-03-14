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
  scheduleImages: ScheduleImageDto[];
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
  studentTimezone: string;
  mateId?: string;
  mateName?: string;
  notes?: string;
  joinedAt: ISODateString;
  pendingExcuseCount: number;
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
    timezone: string;
    notes?: string;
  }[];
}

/** Update the mate (زميل) for a group member */
export interface UpdateMemberMateDto {
  /** Pass null to remove the mate */
  mateId: string | null;
}
