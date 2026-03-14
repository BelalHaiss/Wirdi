import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  AssignLearnersToGroupDto,
  CreateAndAssignLearnersDto,
  GroupMemberDto,
  UpdateMemberMateDto,
} from '@wirdi/shared';
import { UserRole } from 'generated/prisma/client';

@Injectable()
export class GroupMemberService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Create multiple new learners and assign them all to a group in one transaction.
   */
  async createAndAssignLearners(dto: CreateAndAssignLearnersDto): Promise<GroupMemberDto[]> {
    const group = await this.db.group.findUnique({
      where: { id: dto.groupId },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('المجموعة غير موجودة');

    const members = await this.db.$transaction(async (tx) => {
      const created: GroupMemberDto[] = [];

      for (const learnerData of dto.learners) {
        const student = await tx.user.create({
          data: {
            name: learnerData.name,
            timezone: learnerData.timezone,
            role: UserRole.STUDENT,
            notes: learnerData.notes,
          },
        });

        const member = await tx.groupMember.create({
          data: { groupId: dto.groupId, studentId: student.id },
          include: {
            student: { select: { name: true, timezone: true, notes: true } },
            mate: { select: { name: true } },
          },
        });

        created.push({
          id: member.id,
          groupId: member.groupId,
          studentId: member.studentId,
          studentName: member.student.name,
          studentTimezone: member.student.timezone,
          mateId: member.mateId ?? undefined,
          mateName: member.mate?.name ?? undefined,
          notes: member.student.notes ?? undefined,
          joinedAt: member.joinedAt.toISOString() as GroupMemberDto['joinedAt'],
          pendingExcuseCount: 0,
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
    const group = await this.db.group.findUnique({
      where: { id: dto.groupId },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('المجموعة غير موجودة');

    // Validate all students exist
    const students = await this.db.user.findMany({
      where: { id: { in: dto.studentIds }, role: UserRole.STUDENT },
      select: { id: true },
    });
    if (students.length !== dto.studentIds.length) {
      throw new NotFoundException('بعض المتعلمين غير موجودين');
    }

    // Check for existing memberships
    const existing = await this.db.groupMember.findMany({
      where: { groupId: dto.groupId, studentId: { in: dto.studentIds } },
      select: { studentId: true },
    });
    if (existing.length > 0) {
      throw new ConflictException('بعض المتعلمين منتسبون بالفعل إلى هذه المجموعة');
    }

    const members = await this.db.$transaction(
      dto.studentIds.map((studentId) =>
        this.db.groupMember.create({
          data: { groupId: dto.groupId, studentId },
          include: {
            student: { select: { name: true, timezone: true, notes: true } },
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
      studentTimezone: m.student.timezone,
      mateId: m.mateId ?? undefined,
      mateName: m.mate?.name ?? undefined,
      notes: m.student.notes ?? undefined,
      joinedAt: m.joinedAt.toISOString() as GroupMemberDto['joinedAt'],
      pendingExcuseCount: 0,
    }));
  }

  /**
   * Update the mate (زميل) for a group member.
   */
  async updateMate(memberId: string, dto: UpdateMemberMateDto): Promise<GroupMemberDto> {
    const member = await this.db.groupMember.findUnique({
      where: { id: memberId },
      select: { id: true, groupId: true, studentId: true },
    });

    if (!member) throw new NotFoundException('عضو الحلقة غير موجود');

    if (dto.mateId !== null) {
      if (dto.mateId === member.studentId) {
        throw new BadRequestException('لا يمكن للمتعلم أن يكون زميله الخاص');
      }

      const mate = await this.db.user.findFirst({
        where: { id: dto.mateId, role: UserRole.STUDENT },
        select: { id: true },
      });
      if (!mate) throw new NotFoundException('الزميل المختار غير موجود');
    }

    const updated = await this.db.groupMember.update({
      where: { id: memberId },
      data: { mateId: dto.mateId },
      include: {
        student: { select: { name: true, timezone: true, notes: true } },
        mate: { select: { name: true } },
      },
    });

    return {
      id: updated.id,
      groupId: updated.groupId,
      studentId: updated.studentId,
      studentName: updated.student.name,
      studentTimezone: updated.student.timezone,
      mateId: updated.mateId ?? undefined,
      mateName: updated.mate?.name ?? undefined,
      notes: updated.student.notes ?? undefined,
      joinedAt: updated.joinedAt.toISOString() as GroupMemberDto['joinedAt'],
      pendingExcuseCount: 0,
    };
  }

  /**
   * Remove a learner from a group (deletes the GroupMember row).
   * Also clears mateId for any member in the same group who had this learner as their mate.
   */
  async removeMember(memberId: string): Promise<void> {
    const member = await this.db.groupMember.findUnique({
      where: { id: memberId },
      select: { id: true, groupId: true, studentId: true },
    });

    if (!member) throw new NotFoundException('عضو الحلقة غير موجود');

    await this.db.$transaction([
      this.db.groupMember.updateMany({
        where: { groupId: member.groupId, mateId: member.studentId },
        data: { mateId: null },
      }),
      this.db.groupMember.delete({ where: { id: memberId } }),
    ]);
  }
}
