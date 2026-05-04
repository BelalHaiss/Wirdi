import {
  ISODateString,
  PaginationQueryType,
  PaginationResponseMeta,
  TimeZoneType,
} from './types/api.types';
import type { UserRole } from './user.types';
import type { PlatformType, RecitationType } from './learner-details.constants';

export interface LearnerContactDto {
  notes?: string;
  age?: number;
  platform?: PlatformType;
  schedule?: number;
  recitation?: RecitationType;
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
  sortBy?: 'name' | 'timezone' | 'notes' | 'groupCount' | 'createdAt' | 'age' | 'schedule';
  sortOrder?: 'asc' | 'desc';
  timezone?: TimeZoneType;
  recitation?: RecitationType;
  platform?: PlatformType;
};

export type QueryLearnersResponseDto = {
  data: LearnerDto[];
} & PaginationResponseMeta;
