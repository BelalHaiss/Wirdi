import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Typography } from '@/components/ui/typography';
import type { GroupMemberDto, ReadSourceType } from '@wirdi/shared';

const DAY_LABELS: Record<number, string> = {
  6: 'السبت',
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
};

const READ_SOURCE_OPTIONS = {
  DEFAULT_GROUP_MATE: 'DEFAULT_GROUP_MATE',
  DIFFERENT_GROUP_MATE: 'DIFFERENT_GROUP_MATE',
  OUTSIDE_GROUP: 'OUTSIDE_GROUP',
} as const;

type Props = {
  recordableDay: {
    dayNumber: number;
    isLate: boolean;
  };
  daysInWeek: { dayNumber: number; dayRecorded: boolean }[];
  allAwradChecked: boolean;
  onCheckAllAwrad: (checked: boolean) => void;
  readSource: ReadSourceType;
  onReadSourceChange: (value: ReadSourceType) => void;
  selectedMateId: string | null;
  onMateChange: (value: string) => void;
  eligibleMates: GroupMemberDto[];
  isRecording: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
};

export function WirdRecordingCard({
  recordableDay,
  daysInWeek,
  allAwradChecked,
  onCheckAllAwrad,
  readSource,
  onReadSourceChange,
  selectedMateId,
  onMateChange,
  eligibleMates,
  isRecording,
  canSubmit,
  onSubmit,
}: Props) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-2 flex-wrap'>
          <CardTitle className='text-base'>تسجيل الورد</CardTitle>
          <Typography size='sm' className='text-muted-foreground'>
            ليوم {DAY_LABELS[recordableDay.dayNumber]}
          </Typography>
          {recordableDay.isLate && (
            <div className='flex items-center gap-1 text-xs text-warning bg-warning/10 px-2 py-1 rounded-full'>
              <AlertTriangle className='h-3 w-3' />
              تأخير في التسجيل
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-5'>
        {/* Single all-or-none awrad checkbox */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Checkbox
              id='check-all-awrad'
              checked={allAwradChecked}
              onCheckedChange={onCheckAllAwrad}
            />
            <Label htmlFor='check-all-awrad' className='cursor-pointer font-medium text-sm'>
              اسمع جميع الأوراد ✓
            </Label>
          </div>

          {/* Show unrecorded days warning */}
          {daysInWeek.some((d) => !d.dayRecorded) && (
            <div className='bg-warning/5 border border-warning/30 rounded-lg p-3 space-y-2'>
              <Typography size='xs' weight='medium' className='text-warning'>
                الأيام التي لم تسجل فيها:
              </Typography>
              <div className='flex flex-wrap gap-2'>
                {daysInWeek
                  .filter((d) => !d.dayRecorded)
                  .map((d) => (
                    <span
                      key={d.dayNumber}
                      className='text-xs bg-warning/10 text-warning px-2 py-1 rounded'
                    >
                      {DAY_LABELS[d.dayNumber]}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Read source selector */}
        <div className='space-y-3'>
          <Label className='text-sm font-medium'>أين سمعت الورد؟</Label>

          <Select value={readSource} onValueChange={onReadSourceChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={READ_SOURCE_OPTIONS.DEFAULT_GROUP_MATE}>
                سمعت على الرفيق الافتراضي
              </SelectItem>
              <SelectItem value={READ_SOURCE_OPTIONS.DIFFERENT_GROUP_MATE}>
                سمعت على رفيق مختلف
              </SelectItem>
              <SelectItem value={READ_SOURCE_OPTIONS.OUTSIDE_GROUP}>سمعت خارج المجموعة</SelectItem>
            </SelectContent>
          </Select>

          {/* Mate selector - only show for non-OUTSIDE_GROUP */}
          {readSource !== READ_SOURCE_OPTIONS.OUTSIDE_GROUP && eligibleMates.length > 0 && (
            <div className='space-y-2'>
              <Label className='text-xs text-muted-foreground'>اختر الرفيق</Label>
              <Select value={selectedMateId ?? ''} onValueChange={onMateChange}>
                <SelectTrigger>
                  <SelectValue placeholder='اختر الرفيق' />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMates.map((mate) => (
                    <SelectItem key={mate.studentId} value={mate.studentId}>
                      {mate.studentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button className='w-full' disabled={!canSubmit || isRecording} onClick={onSubmit}>
          {isRecording ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              جاري التسجيل...
            </>
          ) : (
            'تسجيل الورد'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
