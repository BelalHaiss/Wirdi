import { BookOpen, Users, Pencil, CalendarDays, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { GroupStatusBadge } from '../atoms/GroupStatusBadge';
import { StatChip } from '../atoms/StatChip';
import type { GroupDto } from '@wirdi/shared';

type GroupInfoCardProps = {
  group: GroupDto;
  isEditable: boolean;
  onEditGroup: () => void;
  onOpenSchedule: () => void;
  onManageLearners: () => void;
};

/**
 * Group info card — matches the design in the attached image.
 * isEditable = ADMIN or MODERATOR is logged in.
 */
export function GroupInfoCard({
  group,
  isEditable,
  onEditGroup,
  onOpenSchedule,
  onManageLearners,
}: GroupInfoCardProps) {
  const awradLabel = group.awrad.length > 0 ? group.awrad.join('، ') : 'لا يوجد';

  return (
    <div className='flex flex-col sm:flex-row items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
      <div className='flex-1 flex flex-col gap-3 min-w-0'>
        {/* Name + status */}
        <div className='flex items-center gap-2 flex-wrap'>
          <Typography as='h2' size='xl' weight='bold'>
            {group.name}
          </Typography>
          <GroupStatusBadge status={group.status} />
        </div>

        {/* Stats chips */}
        <div className='flex items-center gap-2 flex-wrap'>
          <StatChip icon={Users} label={`${group.memberCount} متعلم`} />
          <StatChip icon={BookOpen} label={awradLabel} />
        </div>

        {/* Action buttons — visible for editors only */}
        {isEditable && (
          <div className='flex items-center gap-2 flex-wrap pt-1'>
            <Button
              variant='outline'
              color='warning'
              size='sm'
              className='gap-1.5'
              onClick={onEditGroup}
            >
              <Pencil className='h-3.5 w-3.5' />
              تعديل المعلومات
            </Button>
            <Button variant='outline' size='sm' className='gap-1.5' onClick={onOpenSchedule}>
              <CalendarDays className='h-3.5 w-3.5' />
              جدول أسبوعي
            </Button>
            <Button variant='outline' size='sm' className='gap-1.5' onClick={onManageLearners}>
              <GraduationCap className='h-3.5 w-3.5' />
              إدارة المتعلمين
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
