import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import argon from 'argon2';
import { DatabaseService } from '../database/database.service';
import {
  ChangeOwnPasswordDto,
  CreateStaffUserDto,
  CreateLearnerDto,
  DEFAULT_TIMEZONE,
  ISODateString,
  LearnerDto,
  normalizeArabic,
  QueryLearnersDto,
  QueryLearnersResponseDto,
  StaffUserDto,
  StaffUsersResponseDto,
  UpdateOwnProfileDto,
  UpdateStaffUserDto,
  UserAuthRole,
  UserAuthType,
  UpdateLearnerDto,
  TimeZoneType,
} from '@wirdi/shared';
import { Prisma, User, UserRole } from 'generated/prisma/client';

@Injectable()
export class UserService {
  constructor(private prismaService: DatabaseService) {}

  async findByUsername(username: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username },
    });
    return user;
  }

  async getStaffUsers(actor: User): Promise<StaffUsersResponseDto> {
    this.assertActorCanManageStaff(actor);

    const users = await this.prismaService.user.findMany({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.MODERATOR],
        },
      },
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    });

    return users.map((staffUser) => this.toStaffDto(staffUser));
  }

  async createStaffUser(actor: User, dto: CreateStaffUserDto): Promise<StaffUserDto> {
    this.assertActorCanManageStaff(actor);
    this.assertActorCanManageTargetRole(actor, dto.role);

    const existingUser = await this.prismaService.user.findUnique({
      where: {
        username: dto.username,
      },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const createdStaffUser = await this.prismaService.user.create({
      data: {
        name: dto.name,
        nameNormalized: normalizeArabic(dto.name),
        username: dto.username,
        role: dto.role,
        timezone: dto.timezone ?? DEFAULT_TIMEZONE,
        password: await argon.hash(dto.password),
      },
    });

    return this.toStaffDto(createdStaffUser);
  }

  async updateStaffUser(id: string, actor: User, dto: UpdateStaffUserDto): Promise<StaffUserDto> {
    this.assertActorCanManageStaff(actor);

    const targetUser = await this.prismaService.user.findUnique({
      where: { id },
    });
    if (!targetUser || !this.isStaffRole(targetUser.role)) {
      throw new NotFoundException('Staff user not found');
    }

    this.assertActorCanManageTargetRole(actor, targetUser.role);
    if (dto.role) {
      this.assertActorCanManageTargetRole(actor, dto.role);
    }

    if (dto.username && dto.username !== targetUser.username) {
      const existingUser = await this.prismaService.user.findUnique({
        where: {
          username: dto.username,
        },
        select: { id: true },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    const updatedStaffUser = await this.prismaService.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined
          ? { name: dto.name, nameNormalized: normalizeArabic(dto.name) }
          : {}),
        ...(dto.username !== undefined ? { username: dto.username } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      },
    });

    return this.toStaffDto(updatedStaffUser);
  }

  async deleteStaffUser(id: string, actor: User): Promise<void> {
    this.assertActorCanManageStaff(actor);

    if (id === actor.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const targetUser = await this.prismaService.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!targetUser || !this.isStaffRole(targetUser.role)) {
      throw new NotFoundException('Staff user not found');
    }

    this.assertActorCanManageTargetRole(actor, targetUser.role);

    await this.prismaService.user.delete({
      where: { id },
    });
  }

  async getMe(userId: string): Promise<UserAuthType> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toAuthUserDto(user);
  }

  async updateOwnProfile(userId: string, dto: UpdateOwnProfileDto): Promise<UserAuthType> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (dto.username !== existingUser.username) {
      const found = await this.prismaService.user.findUnique({
        where: {
          username: dto.username,
        },
        select: { id: true },
      });
      if (found && found.id !== userId) {
        throw new ConflictException('Username already exists');
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        nameNormalized: normalizeArabic(dto.name),
        username: dto.username,
        timezone: dto.timezone,
      },
    });

    return this.toAuthUserDto(updatedUser);
  }

  async changeOwnPassword(userId: string, dto: ChangeOwnPasswordDto): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.password) {
      throw new BadRequestException('Password is not set for this account');
    }

    const isCurrentPasswordValid = await argon.verify(user.password, dto.currentPassword);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        password: await argon.hash(dto.newPassword),
      },
    });
  }

  async createLearner(dto: CreateLearnerDto): Promise<LearnerDto> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { username: dto.username },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const createdLearner = await this.prismaService.user.create({
      data: {
        name: dto.name,
        nameNormalized: normalizeArabic(dto.name),
        username: dto.username,
        role: UserRole.STUDENT,
        password: await argon.hash('12345678'),
        timezone: dto.timezone ?? DEFAULT_TIMEZONE,
        notes: dto.contact?.notes,
      },
    });

    return this.toLearnerDto(createdLearner);
  }

  async queryLearners(query: QueryLearnersDto): Promise<QueryLearnersResponseDto> {
    const { skip, take, page } = this.prismaService.handleQueryPagination(query);
    const searchQuery = query.search?.trim();
    const normalizedSearch = searchQuery ? normalizeArabic(searchQuery) : undefined;
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    console.log({ normalizedSearch });
    const where: Prisma.UserWhereInput = {
      role: UserRole.STUDENT,
      ...(normalizedSearch
        ? {
            nameNormalized: {
              contains: normalizedSearch,
            },
          }
        : {}),
    };

    const sortingClause = this.prismaService.handleSortingClause(query.sortBy, sortOrder, [
      'name',
      'timezone',
      'notes',
      'createdAt',
    ]);

    const orderBy: Prisma.UserOrderByWithRelationInput =
      query.sortBy === 'groupCount'
        ? { groupMemberships: { _count: sortOrder } }
        : (sortingClause ?? { createdAt: 'desc' });

    const [learners, count] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          timezone: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          groupMemberships: {
            select: {
              removedAt: true,
              group: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      this.prismaService.user.count({ where }),
    ]);

    return {
      data: learners.map((learner) => this.toLearnerDto(learner)),
      ...this.prismaService.formatPaginationResponse({
        page,
        count,
        limit: take,
      }),
    };
  }

  async exportLearners(): Promise<LearnerDto[]> {
    const learners = await this.prismaService.user.findMany({
      where: { role: UserRole.STUDENT },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        timezone: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        groupMemberships: {
          select: {
            removedAt: true,
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return learners.map((learner) => this.toLearnerDto(learner));
  }

  async updateLearner(id: string, dto: UpdateLearnerDto): Promise<LearnerDto> {
    const learner = await this.prismaService.user.findFirst({
      where: {
        id,
        role: UserRole.STUDENT,
      },
    });

    if (!learner) {
      throw new NotFoundException('Learner not found');
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
      data.nameNormalized = normalizeArabic(dto.name);
    }

    if (dto.username !== undefined && dto.username !== learner.username) {
      const existingWithUsername = await this.prismaService.user.findUnique({
        where: { username: dto.username },
        select: { id: true },
      });
      if (existingWithUsername) {
        throw new ConflictException('Username already exists');
      }
      data.username = dto.username;
    }

    if (dto.timezone !== undefined) {
      data.timezone = dto.timezone;
    }

    if (dto.contact?.notes !== undefined) {
      data.notes = dto.contact.notes;
    }

    const updatedLearner = await this.prismaService.user.update({
      where: {
        id,
      },
      data,
    });

    return this.toLearnerDto(updatedLearner);
  }

  async deleteLearner(id: string): Promise<void> {
    const deletedLearnersCount = await this.prismaService.user.deleteMany({
      where: {
        id,
        role: UserRole.STUDENT,
      },
    });

    if (deletedLearnersCount.count === 0) {
      throw new NotFoundException('Learner not found');
    }
  }

  private assertActorCanManageStaff(actor: User): void {
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.MODERATOR) {
      throw new ForbiddenException('You are not allowed to manage staff users');
    }
  }

  private assertActorCanManageTargetRole(actor: User, role: UserAuthRole): void {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if (actor.role === UserRole.MODERATOR && role === UserRole.MODERATOR) {
      return;
    }

    throw new ForbiddenException('You are not allowed to manage users with this role');
  }

  private isStaffRole(role: UserRole): role is UserAuthRole {
    return role === UserRole.ADMIN || role === UserRole.MODERATOR;
  }

  private toStaffDto(user: {
    id: string;
    username: string | null;
    name: string;
    role: UserRole;
    timezone: string;
    createdAt: Date;
    updatedAt: Date;
  }): StaffUserDto {
    if (!user.username || !this.isStaffRole(user.role)) {
      throw new NotFoundException('Staff user not found');
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      timezone: user.timezone as TimeZoneType,
      createdAt: user.createdAt.toISOString() as ISODateString,
      updatedAt: user.updatedAt.toISOString() as ISODateString,
    };
  }

  private toAuthUserDto(user: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    timezone: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserAuthType {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      timezone: user.timezone as TimeZoneType,
      createdAt: user.createdAt.toISOString() as ISODateString,
      updatedAt: user.updatedAt.toISOString() as ISODateString,
    };
  }

  private toLearnerDto(user: {
    id: string;
    username: string | null;
    name: string;
    role: UserRole;
    timezone: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    groupMemberships?: { removedAt: Date | null; group: { id: string; name: string } }[];
  }): LearnerDto {
    const groups = (user.groupMemberships ?? []).map((m) => ({
      id: m.group.id,
      name: m.group.name,
      removedAt: m.removedAt ? (m.removedAt.toISOString() as ISODateString) : undefined,
    }));

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      timezone: user.timezone as TimeZoneType,
      contact: {
        notes: user.notes ?? undefined,
      },
      groupCount: groups.filter((group) => !group.removedAt).length,
      groups,
      createdAt: user.createdAt.toISOString() as ISODateString,
      updatedAt: user.updatedAt.toISOString() as ISODateString,
    };
  }
}
