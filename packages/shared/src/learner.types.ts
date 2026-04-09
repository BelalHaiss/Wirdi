import {
  ISODateString,
  PaginationQueryType,
  PaginationResponseMeta,
  SortingQueryType,
  TimeZoneType,
} from './types/api.types';
import type { UserRole } from './user.types';

export interface LearnerContactDto {
  notes?: string;
}

export interface LearnerGroupSummaryDto {
  id: string;
  name: string;
  removedAt?: ISODateString;
}

export interface LearnerDto {
  id: string;
  username: string | null;
  name: string;
  role: UserRole;
  timezone: TimeZoneType;
  contact: LearnerContactDto;
  groupCount?: number;
  groups?: LearnerGroupSummaryDto[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateLearnerDto {
  name: string;
  username: string;
  timezone: TimeZoneType;
  contact?: LearnerContactDto;
}

export interface UpdateLearnerDto {
  name?: string;
  username?: string;
  timezone?: TimeZoneType;
  contact?: LearnerContactDto;
}

export type QueryLearnersDto = PaginationQueryType & {
  search?: string;
} & SortingQueryType;

export type QueryLearnersResponseDto = {
  data: LearnerDto[];
} & PaginationResponseMeta;
