import { useState } from 'react';
import { toast } from 'sonner';
import { useApiQuery } from '@/lib/hooks/useApiQuery';
import { useApiMutation } from '@/lib/hooks/useApiMutation';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useApp } from '@/contexts/AppContext';
import { groupService } from '../services/group.service';
import type { GroupDto, UpdateGroupDto } from '@wirdi/shared';

export function useGroupDetailViewModel(groupId: string) {
  const { user } = useApp();
  const isEditable = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const groupQuery = useApiQuery<GroupDto>({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: () => groupService.getGroup(groupId),
  });

  const updateGroupMutation = useApiMutation<UpdateGroupDto, GroupDto>({
    mutationFn: (dto) => groupService.updateGroup(groupId, dto),
    onSuccess: async () => {
      toast.success('تم تحديث معلومات الحلقة');
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      setIsEditModalOpen(false);
    },
    onError: (err) => toast.error(err.message ?? 'حدث خطأ'),
  });

  const group = groupQuery.data?.data;

  const handleUpdateGroup = async (dto: UpdateGroupDto) => {
    await updateGroupMutation.mutateAsync(dto);
  };

  return {
    group,
    isEditable,
    isLoading: groupQuery.isLoading,
    queryError: groupQuery.error?.message ?? null,
    // Edit modal
    isEditModalOpen,
    openEditModal: () => setIsEditModalOpen(true),
    closeEditModal: () => setIsEditModalOpen(false),
    handleUpdateGroup,
    isUpdating: updateGroupMutation.isPending,
    // Schedule modal
    isScheduleModalOpen,
    openScheduleModal: () => setIsScheduleModalOpen(true),
    closeScheduleModal: () => setIsScheduleModalOpen(false),
  };
}
