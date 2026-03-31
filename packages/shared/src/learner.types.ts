import {
  ISODateString,
  PaginationQueryType,
  PaginationResponseMeta,
  TimeZoneType,
} from './types/api.types';

export interface LearnerContactDto {
  notes?: string;
}

export interface LearnerGroupSummaryDto {
  id: string;
  name: string;
}

export interface LearnerDto {
  id: string;
  username: string | null;
  name: string;
  role: 'STUDENT';
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
};

export type QueryLearnersResponseDto = {
  data: LearnerDto[];
} & PaginationResponseMeta;
