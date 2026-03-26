import { Loader2, Users, Pencil } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { LearnerEditDeleteActions } from '@/modules/learners';
import { ExcuseModal } from './ExcuseModal';
import type { GroupMemberDto, UpdateLearnerDto } from '@wirdi/shared';

type GroupLearnersTableProps = {
  members: GroupMemberDto[];
  isLoading: boolean;
  groupId: string;
  userTimezone: string;
  onEditMate?: (member: GroupMemberDto) => void;
  onEditLearner?: (studentId: string, data: UpdateLearnerDto) => Promise<void>;
  onDeleteLearner?: (memberId: string) => Promise<void>;
  isUpdatingLearner?: boolean;
};

export function GroupLearnersTable({
  members,
  isLoading,
  groupId,
  userTimezone,
  onEditMate,
  onEditLearner,
  onDeleteLearner,
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
                <ExcuseModal
                  studentId={member.studentId}
                  studentName={member.studentName}
                  groupId={groupId}
                  userTimezone={userTimezone}
                  activeExcuseExpiresAt={member.activeExcuseExpiresAt}
                />
              </TableCell>
              <TableCell className='px-4 py-3'>
                <div className='flex items-center gap-1 justify-end'>
                  {onEditLearner && onDeleteLearner && (
                    <LearnerEditDeleteActions
                      learner={{
                        id: member.studentId,
                        name: member.studentName,
                        username: member.studentUsername,
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
