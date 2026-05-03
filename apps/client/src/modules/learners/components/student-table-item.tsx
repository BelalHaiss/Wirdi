import { LearnerDto, UpdateLearnerDto, LEARNER_DETAIL_FIELDS } from '@wirdi/shared';
import { UserCircle2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { TimezoneDisplay } from '@/components/ui/timezone-display';
import { LearnerEditDeleteActions } from './learner-edit-delete-actions';

type StudentTableItemProps = {
  learner: LearnerDto;
  showActions?: boolean;
  onClick: (learner: LearnerDto) => void;
  onEditSubmit: (data: UpdateLearnerDto) => Promise<void>;
  onDeleteConfirm: () => Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
};

export function StudentTableItem({
  learner,
  showActions = true,
  onClick,
  onEditSubmit,
  onDeleteConfirm,
  isUpdating = false,
}: StudentTableItemProps) {
  const learnerInitial = learner.name.trim().charAt(0) || '؟';

  return (
    <TableRow
      className='cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-900/40'
      onClick={() => onClick(learner)}
    >
      <TableCell className='px-4 py-3'>
        <div className='flex items-center gap-2.5'>
          <div className='size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold'>
            {learnerInitial}
          </div>
          <div className='flex flex-col'>
            <div className='text-sm text-gray-900 dark:text-gray-100 font-medium'>
              {learner.name}
            </div>
            <div className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1'>
              <UserCircle2 className='w-3.5 h-3.5' />
              طالب
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className='px-4 py-3'>
        <TimezoneDisplay timezone={learner.timezone} />
      </TableCell>
      <TableCell className='px-4 py-3 max-w-72'>
        <div className='truncate text-xs text-gray-600 dark:text-gray-400'>
          {learner.contact.notes || 'لا توجد ملاحظات'}
        </div>
      </TableCell>
      <TableCell className='px-4 py-3'>
        <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
          {learner.groupCount ?? 0}
        </div>
      </TableCell>
      {LEARNER_DETAIL_FIELDS.map(({ key }) => (
        <TableCell key={key} className='px-4 py-3'>
          <div className='text-sm text-gray-700 dark:text-gray-300 truncate max-w-28'>
            {learner.contact.details?.[key] ?? (
              <span className='text-muted-foreground text-xs'>-</span>
            )}
          </div>
        </TableCell>
      ))}
      <TableCell className='px-4 py-3 text-right'>
        {showActions ? (
          <div className='flex items-center justify-end gap-2'>
            <LearnerEditDeleteActions
              learner={learner}
              deleteDescription={`هل تريد حذف "${learner.name}"؟`}
              onEditSubmit={onEditSubmit}
              onDeleteConfirm={onDeleteConfirm}
              isUpdating={isUpdating}
            />
          </div>
        ) : (
          '-'
        )}
      </TableCell>
    </TableRow>
  );
}
