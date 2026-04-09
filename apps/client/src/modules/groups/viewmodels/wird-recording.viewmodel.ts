import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { GroupMemberDto, ReadSourceType, RecordLearnerWirdDto } from '@wirdi/shared';
import { useApiQuery } from '@/lib/hooks/useApiQuery';
import { useApiMutation } from '@/lib/hooks/useApiMutation';
import { queryClient, queryKeys } from '@/lib/query-client';
import { learnerWirdService } from '../services/learner-wird.service';
import { groupService } from '../services/group.service';

export function useWirdRecordingViewModel(groupId: string) {
  const [readSource, setReadSource] = useState<ReadSourceType>('DEFAULT_GROUP_MATE');
  const [selectedMateId, setSelectedMateId] = useState<string | null>(null);
  const [allAwradChecked, setAllAwradChecked] = useState(false);

  const overviewQuery = useApiQuery({
    queryKey: queryKeys.learnerWirds.overview(groupId),
    queryFn: () => learnerWirdService.getLearnerGroupOverview(groupId),
  });

  const overview = overviewQuery.data?.data;
  const canFetchMates = overview?.type === 'overview' && readSource === 'DIFFERENT_GROUP_MATE';

  const membersQuery = useApiQuery<GroupMemberDto[]>({
    queryKey: queryKeys.groups.learners(groupId),
    queryFn: () => groupService.getGroupLearners(groupId),
    enabled: canFetchMates,
  });

  const mateOptions = useMemo(() => {
    if (overview?.type !== 'overview') return [];
    return (membersQuery.data?.data ?? []).filter(
      (m) => m.studentId !== overview.myMembership.studentId
    );
  }, [membersQuery.data, overview]);

  const recordMutation = useApiMutation<RecordLearnerWirdDto, void>({
    mutationFn: (dto) => learnerWirdService.recordLearnerWird(dto),
    onSuccess: async () => {
      toast.success('تم تسجيل الورد بنجاح');
      await queryClient.invalidateQueries({ queryKey: queryKeys.learnerWirds.overview(groupId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.wirds.all });
      setReadSource('DEFAULT_GROUP_MATE');
      setSelectedMateId(null);
      setAllAwradChecked(false);
    },
    onError: (err) => toast.error(err.message ?? 'حدث خطأ أثناء التسجيل'),
  });

  const canSubmit =
    overview?.type === 'overview' &&
    overview.groupStatus === 'ACTIVE' &&
    overview.myMembership.status === 'ACTIVE' &&
    overview.recordableDay.status === 'available' &&
    allAwradChecked &&
    (readSource === 'DIFFERENT_GROUP_MATE' ? !!selectedMateId : true);

  const handleRecordWird = async () => {
    if (overview?.type !== 'overview' || overview.recordableDay.status !== 'available') return;
    if (readSource === 'DIFFERENT_GROUP_MATE' && !selectedMateId) return;

    const basePayload = {
      groupId,
      weekId: overview.week.id,
      dayNumber: overview.recordableDay.dayNumber,
    };

    const payload: RecordLearnerWirdDto =
      readSource === 'DIFFERENT_GROUP_MATE'
        ? {
            ...basePayload,
            readSource,
            mateId: selectedMateId!,
          }
        : readSource === 'OUTSIDE_GROUP'
          ? {
              ...basePayload,
              readSource,
              mateId: null,
            }
          : {
              ...basePayload,
              readSource,
              mateId: null,
            };

    await recordMutation.mutateAsync(payload);
  };

  return {
    overview,
    readSource,
    setReadSource,
    selectedMateId,
    setSelectedMateId,
    mateOptions,
    isLoading: overviewQuery.isLoading,
    isLoadingMates: membersQuery.isLoading,
    isRecording: recordMutation.isPending,
    queryError: overviewQuery.error?.message ?? null,
    allAwradChecked,
    setAllAwradChecked,
    canSubmit,
    handleRecordWird,
  };
}
