import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Typography } from '@/components/ui/typography';
import { GroupInfoCard } from '../components/molecules/GroupInfoCard';
import { CreateRequestModal } from '@/modules/requests/components/organisms/CreateRequestModal';
import { useLearnerGroupViewModel } from '../viewmodels/learner-group.viewmodel';
import { LearnerInactiveAlert } from '../components/molecules/LearnerInactiveAlert';
import { GroupInactiveAlert } from '../components/molecules/GroupInactiveAlert';
import { ActiveExcuseNotice } from '../components/molecules/ActiveExcuseNotice';
import { ScheduleCard } from '../components/molecules/ScheduleCard';
import { MyWirdTrackingCard } from '../components/molecules/MyWirdTrackingCard';
import { WirdRecordingCard } from '../components/molecules/WirdRecordingCard';
import { BlockedByPreviousDayMessage } from '../components/molecules/BlockedByPreviousDayMessage';
import { AllRecordedMessage } from '../components/molecules/AllRecordedMessage';
import { ExcuseRequestButton } from '../components/molecules/ExcuseRequestButtonCard';

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
  const [isExcuseModalOpen, setIsExcuseModalOpen] = useState(false);

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
        <AlertDescription>{vm.queryError ?? 'لم يتم العثور على المجموعة'}</AlertDescription>
      </Alert>
    );
  }

  const { group, overview } = vm;
  const isGroupInactive = overview.groupStatus === 'INACTIVE';
  const isInactive = overview.myMembership.status === 'INACTIVE';
  const activeExcuseExpiresAt = overview.myMembership.activeExcuseExpiresAt;

  // Prepare days for the unrecorded warning
  const daysInWeek = overview.myRow.days.map((day) => ({
    dayNumber: day.dayNumber,
    dayRecorded: day.wirdStatus !== 'MISSED',
  }));

  // Get name of the day that's blocking current day
  const blockedByDayNumber =
    overview.recordableDay.status === 'blocked' ? overview.recordableDay.blockedByDay : null;

  const handleRequestActivation = () => {
    setIsExcuseModalOpen(true);
  };

  return (
    <div className='space-y-6'>
      <GroupInfoCard
        group={group}
        isEditable={false}
        onEditGroup={() => {}}
        onOpenSchedule={() => {}}
        onManageLearners={() => {}}
      />

      {/* Inactive learner alert */}
      {isInactive && <LearnerInactiveAlert onRequestActivation={handleRequestActivation} />}

      {/* Inactive group alert */}
      {isGroupInactive && <GroupInactiveAlert />}

      {/* Active excuse notice */}
      {activeExcuseExpiresAt && (
        <ActiveExcuseNotice
          expiresAt={activeExcuseExpiresAt}
          timezone={overview.myMembership.studentTimezone}
        />
      )}

      {/* Schedule image */}
      <ScheduleCard scheduleImage={overview.week.scheduleImage} />

      {/* My tracking */}
      <MyWirdTrackingCard
        row={overview.myRow}
        weekId={overview.week.id}
        groupId={groupId}
        userTimezone={overview.myMembership.studentTimezone}
      />

      {/* Recording form - only visible when active */}
      {!isInactive && !isGroupInactive && overview.recordableDay.status === 'available' && (
        <WirdRecordingCard
          recordableDay={{
            dayNumber: overview.recordableDay.dayNumber,
            isLate: overview.recordableDay.isLate,
          }}
          daysInWeek={daysInWeek}
          allAwradChecked={vm.allAwradChecked}
          onCheckAllAwrad={vm.checkAllAwrad}
          readSource={vm.readSource}
          onReadSourceChange={vm.setReadSource}
          selectedMateId={vm.selectedMateId}
          onMateChange={vm.setSelectedMateId}
          eligibleMates={vm.mateOptions}
          isRecording={vm.isRecording}
          canSubmit={vm.canSubmit}
          onSubmit={vm.handleRecordWird}
        />
      )}

      {/* Blocked by previous day message */}
      {!isInactive &&
        !isGroupInactive &&
        overview.recordableDay.status === 'blocked' &&
        blockedByDayNumber !== null && (
          <BlockedByPreviousDayMessage blockedBy={DAY_LABELS[blockedByDayNumber]} />
        )}

      {/* All recorded message */}
      {!isInactive &&
        !isGroupInactive &&
        overview.recordableDay.status === 'none' &&
        overview.recordableDay.reason === 'all_recorded' && <AllRecordedMessage />}

      {/* Excuse request button - visible when active */}
      {!isInactive && <ExcuseRequestButton onClick={() => setIsExcuseModalOpen(true)} />}

      {/* Excuse modal */}
      <CreateRequestModal
        type='EXCUSE'
        open={isExcuseModalOpen}
        onOpenChange={setIsExcuseModalOpen}
        defaultGroupId={groupId}
        hideGroupSelect
      />
    </div>
  );
}
