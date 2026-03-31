import { Injectable, BadRequestException } from '@nestjs/common';
import argon from 'argon2';
import { DatabaseService } from '../database/database.service';
import {
  AssignLearnersToGroupDto,
  CreateAndAssignLearnersDto,
  GroupMemberDto,
  LearnerDto,
  UpdateMemberMateDto,
  TimeZoneType,
} from '@wirdi/shared';
import { UserRole } from 'generated/prisma/client';

@Injectable()
export class GroupMemberService {
  constructor(private readonly db: DatabaseService) {}

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
            username: learnerData.username,
            password: defaultPasswordHash,
            timezone: learnerData.timezone,
            role: UserRole.STUDENT,
            notes: learnerData.notes,
          },
        });

        const member = await tx.groupMember.create({
          data: { groupId: dto.groupId, studentId: student.id },
          include: {
            student: { select: { name: true, username: true, timezone: true, notes: true } },
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
   */
  async assignLearnersToGroup(dto: AssignLearnersToGroupDto): Promise<GroupMemberDto[]> {
    const members = await this.db.$transaction(
      dto.studentIds.map((studentId) =>
        this.db.groupMember.create({
          data: { groupId: dto.groupId, studentId },
          include: {
            student: { select: { name: true, username: true, timezone: true, notes: true } },
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
      joinedAt: m.joinedAt.toISOString() as GroupMemberDto['joinedAt'],
      status: m.status,
      activeExcuseExpiresAt: undefined,
    }));
  }

  /**
   * Update the mate (زميل) for a group member.
   */
  async updateMate(memberId: string, dto: UpdateMemberMateDto): Promise<GroupMemberDto> {
    // First get member to validate mate assignment and check business rules
    const member = await this.db.groupMember.findUniqueOrThrow({
      where: { id: memberId },
      select: { id: true, groupId: true, studentId: true },
    });

    if (dto.mateId !== null) {
      if (dto.mateId === member.studentId) {
        throw new BadRequestException('لا يمكن للمتعلم أن يكون زميله الخاص');
      }

      await this.db.user.findFirstOrThrow({
        where: { id: dto.mateId, role: UserRole.STUDENT },
        select: { id: true },
      });
    }

    const updated = await this.db.groupMember.update({
      where: { id: memberId },
      data: { mateId: dto.mateId },
      include: {
        student: { select: { name: true, username: true, timezone: true, notes: true } },
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
      joinedAt: updated.joinedAt.toISOString() as GroupMemberDto['joinedAt'],
      status: updated.status,
      activeExcuseExpiresAt: undefined,
    };
  }

  /**
   * Remove a learner from a group (deletes the GroupMember row).
   * Also clears mateId for any member in the same group who had this learner as their mate.
   */
  async removeMember(memberId: string): Promise<void> {
    const member = await this.db.groupMember.findUniqueOrThrow({
      where: { id: memberId },
      select: { id: true, groupId: true, studentId: true },
    });

    await this.db.$transaction([
      this.db.groupMember.updateMany({
        where: { groupId: member.groupId, mateId: member.studentId },
        data: { mateId: null },
      }),
      this.db.groupMember.delete({ where: { id: memberId } }),
    ]);
  }

  /**
   * Get all STUDENT users who are NOT members of the given group.
   */
  async getUnassignedLearners(groupId: string): Promise<LearnerDto[]> {
    await this.db.group.findUniqueOrThrow({ where: { id: groupId }, select: { id: true } });

    const assigned = await this.db.groupMember.findMany({
      where: { groupId },
      select: { studentId: true },
    });
    const assignedIds = assigned.map((m) => m.studentId);

    const learners = await this.db.user.findMany({
      where: { role: UserRole.STUDENT, id: { notIn: assignedIds } },
      orderBy: { name: 'asc' },
    });

    return learners.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: 'STUDENT' as const,
      timezone: u.timezone as TimeZoneType,
      contact: { notes: u.notes ?? undefined },
      createdAt: u.createdAt.toISOString() as LearnerDto['createdAt'],
      updatedAt: u.updatedAt.toISOString() as LearnerDto['updatedAt'],
    }));
  }
}
