import { useParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { PageHeader } from '@/components/ui/page-header';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { GroupLearnersTable } from '../components/organisms/GroupLearnersTable';
import { AddGroupLearnersModal } from '../components/organisms/AddGroupLearnersModal';
import { EditMateDialog } from '../components/organisms/EditMateDialog';
import { ExcuseModal } from '../components/organisms/ExcuseModal';
import { useGroupLearnersViewModel } from '../viewmodels/group-learners.viewmodel';
import { useApp } from '@/contexts/AppContext';

export default function GroupLearnersView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const vm = useGroupLearnersViewModel(id!);

  if (vm.queryError) {
    return (
      <Alert alertType='ERROR'>
        <AlertDescription>{vm.queryError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-4'>
      <PageHeader
        title='إدارة المتعلمين'
        description='نظرة عامة على جميع المتعلمين المسجلين وحالاتهم الحالية'
        actions={
          vm.canManage ? (
            <Button onClick={vm.openAddModal} className='gap-2'>
              <UserPlus className='w-4 h-4' />
              إضافة متعلم جديد
            </Button>
          ) : null
        }
      />

      <GroupLearnersTable
        members={vm.members}
        isLoading={vm.isLoading}
        groupId={id!}
        userTimezone={user?.timezone ?? 'UTC'}
        canManage={vm.canManage}
        onEditMate={vm.canManage ? vm.setMemberPendingMateEdit : undefined}
        onEditLearner={vm.canManage ? vm.handleUpdateLearner : undefined}
        onDeleteLearner={vm.canManage ? vm.handleRemoveMember : undefined}
        onOpenExcuseModal={vm.canManage ? vm.setExcuseModalMember : undefined}
        isUpdatingLearner={vm.isUpdatingLearner}
      />

      <div className='flex items-center justify-between'>
        <Typography size='sm' className='text-muted-foreground'>
          عرض {vm.members.length} من أصل {vm.total} متعلم
        </Typography>
        <PaginationControls value={vm.page} totalPages={vm.totalPages} onValueChange={vm.setPage} />
      </div>

      {vm.canManage && (
        <AddGroupLearnersModal
          open={vm.isAddModalOpen}
          onOpenChange={vm.closeAddModal}
          groupId={id!}
          onSubmit={vm.handleAddLearners}
          isLoading={vm.isAdding}
        />
      )}

      <EditMateDialog
        key={vm.memberPendingMateEdit?.id}
        open={!!vm.memberPendingMateEdit}
        onOpenChange={(open) => !open && vm.setMemberPendingMateEdit(null)}
        member={vm.memberPendingMateEdit}
        allMembers={vm.members}
        onConfirm={vm.handleUpdateMate}
        isLoading={vm.isUpdatingMate}
      />

      {vm.excuseModalMember && (
        <ExcuseModal
          key={vm.excuseModalMember.id}
          open={!!vm.excuseModalMember}
          onOpenChange={(open) => !open && vm.setExcuseModalMember(null)}
          studentId={vm.excuseModalMember.studentId}
          studentName={vm.excuseModalMember.studentName}
          groupId={id!}
        />
      )}
    </div>
  );
}
