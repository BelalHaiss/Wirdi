import { Loader2, Users, AlertCircle, Pencil } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LearnerEditDeleteActions } from '@/modules/learners';
import { formatDate } from '@wirdi/shared';
import type { GroupMemberDto, UpdateLearnerDto } from '@wirdi/shared';

type GroupLearnersTableProps = {
  members: GroupMemberDto[];
  isLoading: boolean;
  groupId: string;
  userTimezone: string;
  canManage?: boolean;
  onEditMate?: (member: GroupMemberDto) => void;
  onEditLearner?: (studentId: string, data: UpdateLearnerDto) => Promise<void>;
  onDeleteLearner?: (memberId: string) => Promise<void>;
  onOpenExcuseModal?: (member: GroupMemberDto) => void;
  isUpdatingLearner?: boolean;
};

export function GroupLearnersTable({
  members,
  isLoading,
  userTimezone,
  canManage = false,
  onEditMate,
  onEditLearner,
  onDeleteLearner,
  onOpenExcuseModal,
  isUpdatingLearner = false,
}: GroupLearnersTableProps) {
  return (
    <Table className='rounded-lg border bg-card shadow-sm'>
      <TableHeader className='bg-muted/40'>
        <TableRow>
          <TableHead className='px-4 py-3 text-right text-xs'>اسم المتعلم</TableHead>
          <TableHead className='px-4 py-3 text-right text-xs'>الزميل المسمع</TableHead>
          <TableHead className='px-4 py-3 text-right text-xs'>ملاحظات</TableHead>
          <TableHead className='px-4 py-3 text-right text-xs'>العذر</TableHead>
          <TableHead className='px-4 py-3 text-left text-xs'>الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={5}>
              <div className='flex items-center justify-center py-8 gap-2 text-muted-foreground'>
                <Loader2 className='w-4 h-4 animate-spin' />
                جاري التحميل...
              </div>
            </TableCell>
          </TableRow>
        ) : members.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5}>
              <div className='flex flex-col items-center justify-center py-10 text-muted-foreground gap-2'>
                <Users className='w-6 h-6 opacity-70' />
                <span>لا يوجد متعلمون في هذه الحلقة</span>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className='px-4 py-3 font-medium'>{member.studentName}</TableCell>

              <TableCell className='px-4 py-3 text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <span>{member.mateName ?? '—'}</span>
                  {onEditMate && (
                    <Button
                      variant='ghost'
                      size='icon'
                      color='warning'
                      className='h-6 w-6'
                      onClick={() => onEditMate(member)}
                    >
                      <Pencil className='h-3 w-3' />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell className='px-4 py-3 text-muted-foreground text-sm'>
                {member.notes ?? '—'}
              </TableCell>
              <TableCell className='px-4 py-3'>
                {member.activeExcuseExpiresAt ? (
                  <div className='flex items-center gap-1.5'>
                    <Badge variant='soft' color='warning' className='gap-1 text-xs'>
                      <AlertCircle className='h-3 w-3' />
                      حتى{' '}
                      {formatDate({
                        date: member.activeExcuseExpiresAt,
                        token: 'dd/MM/yyyy',
                        timezone: userTimezone,
                      })}
                    </Badge>
                    {canManage && onOpenExcuseModal && (
                      <Button
                        variant='ghost'
                        size='icon'
                        color='warning'
                        className='h-6 w-6'
                        onClick={() => onOpenExcuseModal(member)}
                      >
                        <Pencil className='h-3 w-3' />
                      </Button>
                    )}
                  </div>
                ) : (
                  canManage &&
                  onOpenExcuseModal && (
                    <Button
                      variant='ghost'
                      size='sm'
                      color='muted'
                      className='h-7 text-xs gap-1 text-muted-foreground'
                      onClick={() => onOpenExcuseModal(member)}
                    >
                      <AlertCircle className='h-3 w-3' />
                      إضافة
                    </Button>
                  )
                )}
              </TableCell>
              <TableCell className='px-4 py-3'>
                <div className='flex items-center gap-1 justify-end'>
                  {onEditLearner && onDeleteLearner && (
                    <LearnerEditDeleteActions
                      learner={{
                        id: member.studentId,
                        name: member.studentName,
                        timezone: member.studentTimezone,
                        contact: { notes: member.notes },
                        groupCount: undefined,
                        groups: undefined,
                      }}
                      deleteDescription={`هل أنت متأكد من إزالة "${member.studentName}" من الحلقة؟`}
                      onEditSubmit={(data) => onEditLearner(member.studentId, data)}
                      onDeleteConfirm={() => onDeleteLearner(member.id)}
                      isUpdating={isUpdatingLearner}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
