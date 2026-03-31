import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { RequestDto, RequestType } from '@wirdi/shared';
import type { ISODateString } from '@wirdi/shared';

@Injectable()
export class RequestOrchestrator {
  constructor(private readonly db: DatabaseService) {}

  async acceptRequest<T extends RequestType>(
    requestId: string,
    reviewerId: string
  ): Promise<RequestDto<T>> {
    return this.db.$transaction(async (tx) => {
      // Fetch request
      const request = await tx.request.findUniqueOrThrow({
        where: { id: requestId },
        include: {
          student: { select: { name: true } },
          group: { select: { name: true } },
        },
      });

      if (request.status !== 'PENDING') {
        throw new BadRequestException('الطلب تمت مراجعته بالفعل');
      }

      // Execute action based on type
      if (request.type === 'EXCUSE') {
        const payload = request.payload as any;

        // Check for active excuse
        const now = new Date();
        const activeExcuse = await tx.excuse.findFirst({
          where: {
            studentId: request.studentId,
            groupId: payload.groupId,
            expiresAt: { gt: now },
          },
        });

        if (activeExcuse) {
          throw new BadRequestException('يوجد عذر نشط بالفعل لهذا الطالب في هذه المجموعة');
        }

        // Create excuse
        await tx.excuse.create({
          data: {
            studentId: request.studentId,
            groupId: payload.groupId,
            createdBy: reviewerId,
            requestId: request.id,
            expiresAt: new Date(payload.expiresAt),
          },
        });
      } else if (request.type === 'ACTIVATION') {
        const payload = request.payload as any;

        // Update group member status
        await tx.groupMember.update({
          where: {
            groupId_studentId: {
              groupId: payload.groupId,
              studentId: request.studentId,
            },
          },
          data: { status: 'ACTIVE' },
        });
      }

      // Update request status
      const updated = await tx.request.update({
        where: { id: requestId },
        data: {
          status: 'ACCEPTED',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
        include: {
          student: { select: { name: true } },
          group: { select: { name: true } },
          reviewer: { select: { name: true } },
        },
      });

      return this.toDto(updated) as RequestDto<T>;
    });
  }

  async rejectRequest(requestId: string, reviewerId: string): Promise<RequestDto> {
    // Check status first
    const existing = await this.db.request.findUniqueOrThrow({ where: { id: requestId } });
    if (existing.status !== 'PENDING') {
      throw new BadRequestException('الطلب تمت مراجعته بالفعل');
    }

    const updated = await this.db.request.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        student: { select: { name: true } },
        group: { select: { name: true } },
        reviewer: { select: { name: true } },
      },
    });

    return this.toDto(updated);
  }

  private toDto(r: {
    id: string;
    studentId: string;
    groupId: string;
    type: string;
    payload: any;
    status: string;
    reviewedBy: string | null;
    createdAt: Date;
    reviewedAt: Date | null;
    student: { name: string };
    group: { name: string };
    reviewer?: { name: string } | null;
  }): RequestDto {
    return {
      id: r.id,
      studentId: r.studentId,
      studentName: r.student.name,
      groupId: r.groupId,
      groupName: r.group.name,
      type: r.type as RequestType,
      payload: r.payload,
      status: r.status as RequestDto['status'],
      reviewedBy: r.reviewedBy ?? undefined,
      reviewerName: r.reviewer?.name,
      createdAt: r.createdAt.toISOString() as ISODateString,
      reviewedAt: r.reviewedAt ? (r.reviewedAt.toISOString() as ISODateString) : undefined,
    };
  }
}
