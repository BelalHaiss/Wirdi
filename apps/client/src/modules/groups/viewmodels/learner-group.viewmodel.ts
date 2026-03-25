import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useApiQuery } from '@/lib/hooks/useApiQuery';
import { useApiMutation } from '@/lib/hooks/useApiMutation';
import { queryClient, queryKeys } from '@/lib/query-client';
import { groupService } from '../services/group.service';
import { learnerWirdService } from '../services/learner-wird.service';
import type {
  GroupDto,
  GroupMemberDto,
  LearnerGroupOverviewDto,
  RecordLearnerWirdDto,
} from '@wirdi/shared';

export function useLearnerGroupViewModel(groupId: string) {
  const [mateChecked, setMateChecked] = useState(true);
  const [selectedMateId, setSelectedMateId] = useState<string | null>(null);
  const [checkedAwrad, setCheckedAwrad] = useState<Set<string>>(new Set());

  const groupQuery = useApiQuery<GroupDto>({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: () => groupService.getGroup(groupId),
  });

  const overviewQuery = useApiQuery<LearnerGroupOverviewDto>({
    queryKey: queryKeys.learnerWirds.overview(groupId),
    queryFn: () => learnerWirdService.getLearnerGroupOverview(groupId),
  });

  // Fetch group members only when learner unchecks the default mate
  const membersQuery = useApiQuery<GroupMemberDto[]>({
    queryKey: queryKeys.groups.learners(groupId),
    queryFn: () => groupService.getGroupLearners(groupId),
    enabled: !mateChecked,
  });

  const group = groupQuery.data?.data;
  const overview = overviewQuery.data?.data;

  // Filter out the learner themselves from the mate select list
  const mateOptions = useMemo(() => {
    if (!overview) return [];
    return (membersQuery.data?.data ?? []).filter(
      (m) => m.studentId !== overview.myMembership.studentId
    );
  }, [membersQuery.data, overview]);

  const recordMutation = useApiMutation<RecordLearnerWirdDto, void>({
    mutationFn: (dto) => learnerWirdService.recordLearnerWird(dto),
    onSuccess: async () => {
      toast.success('تم تسجيل الورد بنجاح');
      await queryClient.invalidateQueries({ queryKey: queryKeys.learnerWirds.overview(groupId) });
      setCheckedAwrad(new Set());
      setMateChecked(true);
      setSelectedMateId(null);
    },
    onError: (err) => toast.error(err.message ?? 'حدث خطأ أثناء التسجيل'),
  });

  const toggleAwrad = (wird: string) => {
    setCheckedAwrad((prev) => {
      const next = new Set(prev);
      if (next.has(wird)) next.delete(wird);
      else next.add(wird);
      return next;
    });
  };

  const checkAllAwrad = () => {
    if (!group) return;
    if (checkedAwrad.size === group.awrad.length) {
      setCheckedAwrad(new Set());
    } else {
      setCheckedAwrad(new Set(group.awrad));
    }
  };

  const effectiveMateId = useMemo(() => {
    if (mateChecked) return overview?.myMembership.mateId ?? null;
    return selectedMateId;
  }, [mateChecked, overview, selectedMateId]);

  const canSubmit =
    !!group &&
    !!overview &&
    overview.recordableDay.status === 'available' &&
    checkedAwrad.size === group.awrad.length &&
    (mateChecked ? true : !!selectedMateId);

  const handleRecordWird = async () => {
    if (!overview || overview.recordableDay.status !== 'available') return;
    await recordMutation.mutateAsync({
      groupId,
      weekId: overview.week.id,
      dayNumber: overview.recordableDay.dayNumber,
      mateId: effectiveMateId,
    });
  };

  return {
    group,
    overview,
    isLoading: groupQuery.isLoading || overviewQuery.isLoading,
    queryError: groupQuery.error?.message ?? overviewQuery.error?.message ?? null,

    // Mate selection
    mateChecked,
    setMateChecked,
    selectedMateId,
    setSelectedMateId,
    mateOptions,
    isLoadingMembers: membersQuery.isLoading,

    // Awrad checkboxes
    checkedAwrad,
    toggleAwrad,
    checkAllAwrad,
    allAwradChecked: !!group && checkedAwrad.size === group.awrad.length,

    // Submit
    canSubmit,
    handleRecordWird,
    isRecording: recordMutation.isPending,
  };
}
