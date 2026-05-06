// ============================================================================
// DTOs (Public Types)
// ============================================================================

import { ISODateString, TimeZoneType } from './types/api.types';
import type { PlatformType, RecitationType } from './learner-details.constants';

export type UserRole = 'ADMIN' | 'MODERATOR' | 'STUDENT';
export type UserAuthRole = Exclude<UserRole, 'STUDENT'>;

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  timezone: TimeZoneType;
  age?: number;
  platform?: PlatformType;
  schedule?: number;
  recitation?: RecitationType;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserAuthType;
}

export type UserAuthType = {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  timezone: TimeZoneType;
  age?: number;
  platform?: PlatformType;
  schedule?: number;
  recitation?: RecitationType;
};

export interface LoginCredentialsDto {
  phone: string;
  password: string;
}

export interface CreateUserDto {
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  timezone: TimeZoneType;
  password: string;
}

export interface StaffUserDto {
  id: string;
  phone: string;
  name: string;
  role: UserAuthRole;
  timezone: TimeZoneType;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateStaffUserDto {
  phone: string;
  name: string;
  role: UserAuthRole;
  password: string;
  timezone: string;
}

export interface UpdateStaffUserDto {
  phone?: string;
  name?: string;
  role?: UserAuthRole;
  timezone?: string;
}

export type StaffUsersResponseDto = StaffUserDto[];

export interface UpdateOwnProfileDto {
  name: string;
  phone: string;
  timezone: string;
  age?: number;
  platform?: PlatformType;
  schedule?: number;
  recitation?: RecitationType;
}

export interface ChangeOwnPasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PromoteLearnersToModeratorDto {
  studentIds: string[];
}

export interface UserFilterDto {
  role?: UserRole;
  search?: string;
}

export type UserWithOptionalCredentials = {
  id: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  password?: string | null;
  timezone?: string;
};

export type LearnerUser = UserWithOptionalCredentials & {
  role: 'STUDENT';
  phone?: null;
  password?: null;
};

export type NonLearnerUserWithCredentials = UserWithOptionalCredentials & {
  role: UserAuthRole;
  phone: string;
  password: string;
};

export const isLearnerUser = (user: UserWithOptionalCredentials): user is LearnerUser => {
  return (
    user.role === 'STUDENT' &&
    (user.phone === null || user.phone === undefined) &&
    (user.password === null || user.password === undefined)
  );
};

export const isNonLearnerUserWithCredentials = (
  user: UserWithOptionalCredentials
): user is NonLearnerUserWithCredentials => {
  return (
    user.role !== 'STUDENT' &&
    typeof user.phone === 'string' &&
    user.phone.length > 0 &&
    typeof user.password === 'string' &&
    user.password.length > 0
  );
};
