import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Typography } from '@/components/ui/typography';
import { GroupInfoCard } from '../components/molecules/GroupInfoCard';
import { EditGroupModal } from '../components/organisms/EditGroupModal';
import { WeeklyScheduleModal } from '../components/organisms/WeeklyScheduleModal';
import { useGroupDetailViewModel } from '../viewmodels/group-detail.viewmodel';

export default function GroupDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vm = useGroupDetailViewModel(id!);

  if (vm.isLoading) {
    return (
      <div className='flex items-center justify-center py-20 text-muted-foreground gap-2'>
        <Loader2 className='h-5 w-5 animate-spin' />
        <Typography className='text-muted-foreground'>جاري التحميل...</Typography>
      </div>
    );
  }

  if (vm.queryError || !vm.group) {
    return (
      <Alert alertType='ERROR'>
        <AlertDescription>{vm.queryError ?? 'لم يتم العثور على الحلقة'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <GroupInfoCard
        group={vm.group}
        isEditable={vm.isEditable}
        onEditGroup={vm.openEditModal}
        onOpenSchedule={vm.openScheduleModal}
        onManageLearners={() => navigate(`/groups/${id}/learners`)}
      />

      {vm.isEditModalOpen && (
        <EditGroupModal
          open={vm.isEditModalOpen}
          onOpenChange={vm.closeEditModal}
          group={vm.group}
          onSubmit={vm.handleUpdateGroup}
          isLoading={vm.isUpdating}
        />
      )}

      <WeeklyScheduleModal
        open={vm.isScheduleModalOpen}
        onOpenChange={vm.closeScheduleModal}
        groupId={id!}
      />
    </div>
  );
}
