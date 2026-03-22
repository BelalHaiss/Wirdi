import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WirdStatusCell } from './WirdStatusCell';
import { ExcuseModal } from '../organisms/ExcuseModal';
import { EditAttendanceModal } from '../organisms/EditAttendanceModal';
import type { GroupWirdTrackingRowDto } from '@wirdi/shared';

type StudentWirdRowProps = {
  row: GroupWirdTrackingRowDto;
  weekId: string;
  groupId: string;
  userTimezone: string;
  canManage: boolean;
};

export function StudentWirdRow({
  row,
  weekId,
  groupId,
  userTimezone,
  canManage,
}: StudentWirdRowProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <TableRow>
        {/* Name + optional edit button */}
        <TableCell className='px-4 py-3 font-medium text-right'>
          <div className='flex items-center justify-between gap-1'>
            <span>{row.studentName}</span>
            {canManage && (
              <Button
                variant='ghost'
                size='icon'
                color='warning'
                className='h-6 w-6 shrink-0'
                onClick={() => setEditOpen(true)}
              >
                <Pencil className='h-3 w-3' />
              </Button>
            )}
          </div>
        </TableCell>

        {/* 6 day cells */}
        {row.days.map((day) => (
          <TableCell key={day.dayNumber} className='px-3 py-3 text-center'>
            <div className='flex justify-center'>
              <WirdStatusCell status={day.wirdStatus} readOnMateName={day.readOnMateName} />
            </div>
          </TableCell>
        ))}

        {/* تنبيهات الأسبوع */}
        <TableCell className='px-3 py-3 text-center'>
          {row.weekAlertCount > 0 ? (
            <Badge variant='soft' color='danger' className='text-xs'>
              {row.weekAlertCount}
            </Badge>
          ) : (
            <span className='text-xs text-muted-foreground'>—</span>
          )}
        </TableCell>

        {/* تنبيهات الكل */}
        <TableCell className='px-3 py-3 text-center'>
          {row.totalAlertCount > 0 ? (
            <Badge variant='soft' color='warning' className='text-xs'>
              {row.totalAlertCount}
            </Badge>
          ) : (
            <span className='text-xs text-muted-foreground'>—</span>
          )}
        </TableCell>

        {/* العذر */}
        <TableCell className='px-3 py-3 text-center'>
          <ExcuseModal
            studentId={row.studentId}
            studentName={row.studentName}
            groupId={groupId}
            weekId={weekId}
            userTimezone={userTimezone}
            activeExcuseExpiresAt={row.activeExcuseExpiresAt}
            showOnly={!canManage}
          />
        </TableCell>
      </TableRow>

      {canManage && (
        <EditAttendanceModal
          studentId={row.studentId}
          studentName={row.studentName}
          weekId={weekId}
          groupId={groupId}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
