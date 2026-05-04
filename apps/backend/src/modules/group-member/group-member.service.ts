import { Injectable } from '@nestjs/common';
import argon from 'argon2';
import { DatabaseService } from '../database/database.service';
import { TypedEventEmitter } from '../notification/typed-event-emitter.service';
import {
  AssignLearnersToGroupDto,
  CreateAndAssignLearnersDto,
  GroupMemberDto,
  LearnerDto,
  UpdateMemberMateDto,
  TimeZoneType,
  normalizeArabic,
} from '@wirdi/shared';
import { UserRole } from 'generated/prisma/client';

@Injectable()
export class GroupMemberService {
  constructor(
    private readonly db: DatabaseService,
    private readonly typedEmitter: TypedEventEmitter
  ) {}

  /**
   * Create multiple new learners and assign them all to a group in one transaction.
   */
  async createAndAssignLearners(dto: CreateAndAssignLearnersDto): Promise<GroupMemberDto[]> {
    const defaultPasswordHash = await argon.hash('12345678');

    const members = await this.db.$transaction(async (tx) => {
      const created: GroupMemberDto[] = [];

      for (const learnerData of dto.learners) {
        const student = await tx.user.create({
          data: {
            name: learnerData.name,
            nameNormalized: normalizeArabic(learnerData.name),
            username: learnerData.username,
            password: defaultPasswordHash,
            timezone: learnerData.timezone,
            role: UserRole.STUDENT,
            notes: learnerData.notes,
            age: learnerData.age,
            platform: learnerData.platform,
            schedule: learnerData.schedule,
            recitation: learnerData.recitation,
          },
        });

        const member = await tx.groupMember.create({
          data: { groupId: dto.groupId, studentId: student.id },
          include: {
            student: {
              select: {
                name: true,
                username: true,
                timezone: true,
                notes: true,
                age: true,
                platform: true,
                schedule: true,
                recitation: true,
              },
            },
            mate: { select: { name: true } },
          },
        });

        created.push({
          id: member.id,
          groupId: member.groupId,
          studentId: member.studentId,
          studentName: member.student.name,
          studentUsername: member.student.username,
          studentTimezone: member.student.timezone as TimeZoneType,
          mateId: member.mateId ?? undefined,
          mateName: member.mate?.name ?? undefined,
          notes: member.student.notes ?? undefined,
          age: member.student.age ?? undefined,
          platform: member.student.platform ?? undefined,
          schedule: member.student.schedule ?? undefined,
          recitation: member.student.recitation ?? undefined,
          joinedAt: member.joinedAt.toISOString() as GroupMemberDto['joinedAt'],
          status: member.status,
          activeExcuseExpiresAt: undefined,
        });
      }

      return created;
    });

    return members;
  }

  /**
   * Assign existing learners to a group in one transaction.
   * If a learner was previously soft-deleted from this group, restore their membership.
   */
  async assignLearnersToGroup(dto: AssignLearnersToGroupDto): Promise<GroupMemberDto[]> {
    const members = await this.db.$transaction(
      dto.studentIds.map((studentId) =>
        this.db.groupMember.upsert({
          where: { groupId_studentId: { groupId: dto.groupId, studentId } },
          create: { groupId: dto.groupId, studentId },
          update: {
            removedAt: null,
            removedBy: null,
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
          include: {
            student: {
              select: {
                name: true,
                username: true,
                timezone: true,
                notes: true,
                age: true,
                platform: true,
                schedule: true,
                recitation: true,
              },
            },
            mate: { select: { name: true } },
          },
        })
      )
    );

    return members.map((m) => ({
      id: m.id,
      groupId: m.groupId,
      studentId: m.studentId,
      studentName: m.student.name,
      studentUsername: m.student.username,
      studentTimezone: m.student.timezone as TimeZoneType,
      mateId: m.mateId ?? undefined,
      mateName: m.mate?.name ?? undefined,
      notes: m.student.notes ?? undefined,
      age: m.student.age ?? undefined,
      platform: m.student.platform ?? undefined,
      schedule: m.student.schedule ?? undefined,
      recitation: m.student.recitation ?? undefined,
      joinedAt: m.joinedAt.toISOString() as GroupMemberDto['joinedAt'],
      status: m.status,
      activeExcuseExpiresAt: undefined,
    }));
  }

  /**
   * Update the mate (زميل) for a group member.
   */
  async updateMate(memberId: string, dto: UpdateMemberMateDto): Promise<GroupMemberDto> {
    const updated = await this.db.groupMember.update({
      where: { id: memberId },
      data: { mateId: dto.mateId },
      include: {
        student: {
          select: {
            name: true,
            username: true,
            timezone: true,
            notes: true,
            age: true,
            platform: true,
            schedule: true,
            recitation: true,
          },
        },
        mate: { select: { name: true } },
      },
    });

    return {
      id: updated.id,
      groupId: updated.groupId,
      studentId: updated.studentId,
      studentName: updated.student.name,
      studentUsername: updated.student.username,
      studentTimezone: updated.student.timezone as TimeZoneType,
      mateId: updated.mateId ?? undefined,
      mateName: updated.mate?.name ?? undefined,
      notes: updated.student.notes ?? undefined,
      age: updated.student.age ?? undefined,
      platform: updated.student.platform ?? undefined,
      schedule: updated.student.schedule ?? undefined,
      recitation: updated.student.recitation ?? undefined,
      joinedAt: updated.joinedAt.toISOString() as GroupMemberDto['joinedAt'],
      status: updated.status,
      activeExcuseExpiresAt: undefined,
    };
  }

  /**
   * Remove a learner from a group (soft delete on GroupMember row).
   * Also clears mateId for any member in the same group who had this learner as their mate.
   */
  async removeMember(memberId: string, actorId: string): Promise<void> {
    const result = await this.db.$transaction(async (tx) => {
      const member = await tx.groupMember.findUniqueOrThrow({
        where: { id: memberId },
        select: { id: true, groupId: true, studentId: true, removedAt: true },
      });

      if (member.removedAt) {
        return null;
      }

      await tx.groupMember.updateMany({
        where: { groupId: member.groupId, mateId: member.studentId, removedAt: null },
        data: { mateId: null },
      });

      await tx.groupMember.update({
        where: { id: memberId },
        data: {
          removedAt: new Date(),
          removedBy: actorId,
          status: 'INACTIVE',
        },
      });

      const student = await tx.user.findUnique({
        where: { id: member.studentId },
        select: { id: true, name: true },
      });

      const group = await tx.group.findUnique({
        where: { id: member.groupId },
        select: { id: true, name: true, moderatorId: true },
      });

      const admins = await tx.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });

      if (!student || !group) {
        return null;
      }

      return {
        studentId: student.id,
        studentName: student.name,
        groupId: group.id,
        groupName: group.name,
        moderatorId: group.moderatorId,
        adminIds: admins.map((admin) => admin.id),
      };
    });

    if (!result) {
      return;
    }

    const recipients = new Set<string>([result.studentId, ...result.adminIds]);
    if (result.moderatorId) {
      recipients.add(result.moderatorId);
    }

    for (const recipientId of recipients) {
      this.typedEmitter.emit('notification.send', {
        type: 'LEARNER_REMOVED',
        recipientId,
        payload: {
          studentId: result.studentId,
          studentName: result.studentName,
          groupId: result.groupId,
          groupName: result.groupName,
        },
      });
    }
  }

  /**
   * Get all users who are NOT members of the given group.
   */
  async getUnassignedLearners(groupId: string): Promise<LearnerDto[]> {
    await this.db.group.findUniqueOrThrow({ where: { id: groupId }, select: { id: true } });

    const assigned = await this.db.groupMember.findMany({
      where: { groupId, removedAt: null },
      select: { studentId: true },
    });
    const assignedIds = assigned.map((m) => m.studentId);

    const learners = await this.db.user.findMany({
      where: { id: { notIn: assignedIds } },
      orderBy: { name: 'asc' },
    });

    return learners.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      timezone: u.timezone as TimeZoneType,
      contact: {
        notes: u.notes ?? undefined,
        age: u.age ?? undefined,
        platform: u.platform ?? undefined,
        schedule: u.schedule ?? undefined,
        recitation: u.recitation ?? undefined,
      },
      createdAt: u.createdAt.toISOString() as LearnerDto['createdAt'],
      updatedAt: u.updatedAt.toISOString() as LearnerDto['updatedAt'],
    }));
  }

  async getRemovedMembers(groupId: string): Promise<GroupMemberDto[]> {
    const members = await this.db.groupMember.findMany({
      where: { groupId, removedAt: { not: null } },
      orderBy: { removedAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            username: true,
            timezone: true,
            notes: true,
            age: true,
            platform: true,
            schedule: true,
            recitation: true,
          },
        },
        mate: { select: { name: true } },
      },
    });

    return members.map((member) => ({
      id: member.id,
      groupId: member.groupId,
      studentId: member.studentId,
      studentName: member.student.name,
      studentUsername: member.student.username,
      studentTimezone: member.student.timezone as TimeZoneType,
      mateId: member.mateId ?? undefined,
      mateName: member.mate?.name ?? undefined,
      notes: member.student.notes ?? undefined,
      age: member.student.age ?? undefined,
      platform: member.student.platform ?? undefined,
      schedule: member.student.schedule ?? undefined,
      recitation: member.student.recitation ?? undefined,
      joinedAt: member.joinedAt.toISOString() as GroupMemberDto['joinedAt'],
      status: member.status,
      removedAt: member.removedAt
        ? (member.removedAt.toISOString() as GroupMemberDto['removedAt'])
        : undefined,
      removedById: member.removedBy ?? undefined,
      activeExcuseExpiresAt: undefined,
    }));
  }
}
