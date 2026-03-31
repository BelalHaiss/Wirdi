import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { GroupInfoCard } from '../components/molecules/GroupInfoCard';
import { WirdTrackingTable } from '../components/organisms/WirdTrackingTable';
import { useLearnerGroupViewModel } from '../viewmodels/learner-group.viewmodel';

const DAY_LABELS: Record<number, string> = {
  6: 'السبت',
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
};

type Props = { groupId: string };

export default function LearnerGroupDetailView({ groupId }: Props) {
  const vm = useLearnerGroupViewModel(groupId);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);

  if (vm.isLoading) {
    return (
      <div className='flex items-center justify-center py-20 text-muted-foreground gap-2'>
        <Loader2 className='h-5 w-5 animate-spin' />
        <Typography className='text-muted-foreground'>جاري التحميل...</Typography>
      </div>
    );
  }

  if (vm.queryError || !vm.group || !vm.overview) {
    return (
      <Alert alertType='ERROR'>
        <AlertDescription>{vm.queryError ?? 'لم يتم العثور على الحلقة'}</AlertDescription>
      </Alert>
    );
  }

  const { group, overview } = vm;

  // Check if learner is inactive (blocked)
  const isInactive = overview.myMembership.status === 'INACTIVE';

  return (
    <div className='space-y-6'>
      <GroupInfoCard
        group={group}
        isEditable={false}
        onEditGroup={() => {}}
        onOpenSchedule={() => {}}
        onManageLearners={() => {}}
      />

      {/* Blocked UI for inactive members */}
      {isInactive && (
        <Card className='border-danger/40 bg-danger/5'>
          <CardContent className='pt-6 space-y-4'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-danger/10 p-3 shrink-0'>
                <AlertTriangle className='h-6 w-6 text-danger' />
              </div>
              <div className='flex-1 space-y-2'>
                <Typography as='h3' size='lg' weight='semibold' className='text-danger'>
                  تم إيقاف عضويتك في هذه الحلقة
                </Typography>
                <Typography as='div' size='sm' className='text-muted-foreground leading-relaxed'>
                  لقد تم إيقاف تفعيل عضويتك في هذه الحلقة. لا يمكنك تسجيل الورد حاليًا. إذا كنت ترغب
                  في العودة أو لديك استفسار، يرجى التواصل مع المشرف.
                </Typography>
              </div>
            </div>
            <div className='flex gap-2 flex-wrap'>
              <Button
                variant='outline'
                color='danger'
                size='sm'
                className='gap-2'
                onClick={() => {
                  // TODO: Implement report/appeal functionality
                  console.log('Report/Appeal clicked');
                }}
              >
                <FileText className='h-4 w-4' />
                تقديم طلب إعادة تفعيل
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule image */}
      <Card>
        <CardHeader
          className='cursor-pointer select-none pb-3'
          onClick={() => setScheduleExpanded((v) => !v)}
        >
          <div className='flex items-center gap-3'>
            <div className='w-14 h-14 rounded-lg overflow-hidden border shrink-0 bg-muted'>
              <img
                src={overview.week.scheduleImage.imageUrl}
                alt={overview.week.scheduleImage.name}
                className='w-full h-full object-cover'
              />
            </div>
            <div className='flex-1 min-w-0'>
              <CardTitle className='text-base'>جدول الأسبوع</CardTitle>
              <Typography size='sm' className='text-muted-foreground mt-0.5'>
                الأسبوع {overview.week.weekNumber} — {overview.week.scheduleImage.name}
              </Typography>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='shrink-0 text-muted-foreground'
              tabIndex={-1}
            >
              {scheduleExpanded ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </Button>
          </div>
        </CardHeader>

        {scheduleExpanded && (
          <CardContent className='pt-0'>
            <img
              src={overview.week.scheduleImage.imageUrl}
              alt={overview.week.scheduleImage.name}
              className='w-full max-w-md mx-auto rounded-xl border object-contain'
            />
          </CardContent>
        )}
      </Card>

      {/* Learner's own tracking row */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>سجل ورودك</CardTitle>
        </CardHeader>
        <CardContent>
          <WirdTrackingTable
            rows={[overview.myRow]}
            isLoading={false}
            weekId={overview.week.id}
            groupId={groupId}
            userTimezone={overview.myMembership.studentTimezone}
            canManage={false}
          />
        </CardContent>
      </Card>

      {/* Record wird — only shown when active AND there's a recordable day */}
      {!isInactive && overview.recordableDay.status === 'available' && (
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2 flex-wrap'>
              <CardTitle className='text-base'>تسجيل الورد</CardTitle>
              <Typography size='sm' className='text-muted-foreground'>
                {DAY_LABELS[overview.recordableDay.dayNumber]}
              </Typography>
              {overview.recordableDay.isLate && (
                <Badge variant='soft' color='warning'>
                  متأخر
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className='space-y-5'>
            {/* Single all-or-none awrad checkbox */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='check-all-awrad'
                  checked={vm.allAwradChecked}
                  onCheckedChange={vm.checkAllAwrad}
                />
                <Label htmlFor='check-all-awrad' className='font-semibold cursor-pointer'>
                  قرأت جميع الأوراد
                </Label>
              </div>
              <div className='flex flex-wrap gap-2 pr-6'>
                {group.awrad.map((wird) => (
                  <Badge
                    key={wird}
                    variant='soft'
                    color={vm.checkedAwrad.has(wird) ? 'primary' : 'muted'}
                  >
                    {wird}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Mate selection */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='mate-checked'
                  checked={vm.mateChecked}
                  onCheckedChange={(v) => vm.setMateChecked(!!v)}
                />
                <Label htmlFor='mate-checked' className='cursor-pointer'>
                  قرأت على{' '}
                  <span className='font-semibold'>
                    {overview.myMembership.mateName ?? 'الزميل الافتراضي'}
                  </span>
                </Label>
              </div>

              {!vm.mateChecked && (
                <Select
                  value={vm.selectedMateId ?? ''}
                  onValueChange={vm.setSelectedMateId}
                  disabled={vm.isLoadingMembers}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='اختر الزميل الذي قرأت عليه' />
                  </SelectTrigger>
                  <SelectContent>
                    {vm.mateOptions.map((m) => (
                      <SelectItem key={m.studentId} value={m.studentId}>
                        {m.studentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Button
              className='w-full'
              disabled={!vm.canSubmit || vm.isRecording}
              onClick={vm.handleRecordWird}
            >
              {vm.isRecording ? <Loader2 className='h-4 w-4 animate-spin' /> : 'إرسال للاعتماد'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Blocked by previous day message — only for active members */}
      {!isInactive && overview.recordableDay.status === 'blocked' && (
        <Card className='border-warning/40 bg-warning/5'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-warning shrink-0 mt-0.5' />
              <div>
                <Typography as='div' size='sm' weight='medium'>
                  لا يمكن تسجيل الورد حاليًا
                </Typography>
                <Typography as='div' size='xs' className='text-muted-foreground mt-1'>
                  يجب تسجيل يوم {DAY_LABELS[overview.recordableDay.blockedByDay]} أولاً قبل
                  المتابعة.
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All recorded message — only for active members */}
      {!isInactive &&
        overview.recordableDay.status === 'none' &&
        overview.recordableDay.reason === 'all_recorded' && (
          <Card className='border-success/40 bg-success/5'>
            <CardContent className='pt-6 text-center'>
              <Typography as='div' size='sm' className='text-success font-medium'>
                أحسنت! تم تسجيل جميع أيام الأسبوع ✓
              </Typography>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
