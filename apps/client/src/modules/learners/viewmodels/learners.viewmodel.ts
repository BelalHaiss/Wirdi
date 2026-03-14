import { useState } from 'react';
import type { CreateLearnerDto, LearnerDto, UpdateLearnerDto } from '@wirdi/shared';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { useApiMutation } from '@/lib/hooks/useApiMutation';
import { useApiQuery } from '@/lib/hooks/useApiQuery';
import { queryClient, queryKeys } from '@/lib/query-client';
import { learnerService } from '../services/learner.service';

export type LearnerModalMode = 'view' | 'create';

const PAGE_SIZE = 10;

export function useLearnersViewModel() {
  const { user } = useApp();
  const canManageLearners = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const [searchQuery, setSearchQueryState] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLearner, setSelectedLearner] = useState<LearnerDto | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState<LearnerModalMode>('view');

  const learnersQuery = useApiQuery<LearnerDto[]>({
    queryKey: queryKeys.learners.list({
      page,
      limit: PAGE_SIZE,
      search: searchQuery || undefined,
    }),
    queryFn: () =>
      learnerService.queryLearners({
        page,
        limit: PAGE_SIZE,
        search: searchQuery || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const createLearnerMutation = useApiMutation<CreateLearnerDto, LearnerDto>({
    mutationFn: learnerService.createLearner,
    onSuccess: async () => {
      toast.success('تمت إضافة المتعلم بنجاح');
      await queryClient.invalidateQueries({ queryKey: queryKeys.learners.all });
    },
  });

  const updateLearnerMutation = useApiMutation<{ id: string; data: UpdateLearnerDto }, LearnerDto>({
    mutationFn: ({ id, data }) => learnerService.updateLearner(id, data),
    onSuccess: async () => {
      toast.success('تم تعديل بيانات المتعلم بنجاح');
      await queryClient.invalidateQueries({ queryKey: queryKeys.learners.all });
    },
  });

  const deleteLearnerMutation = useApiMutation<string, null>({
    mutationFn: (learnerId: string) => learnerService.deleteLearner(learnerId),
    onSuccess: async () => {
      toast.success('تم حذف المتعلم بنجاح');
      await queryClient.invalidateQueries({ queryKey: queryKeys.learners.all });
    },
  });

  const handleSearchQueryChange = (value: string) => {
    setSearchQueryState(value);
    setPage(1);
  };

  const openCreateModal = () => {
    setSelectedLearner(null);
    setStudentModalMode('create');
    setIsStudentModalOpen(true);
  };

  const openViewModal = (learner: LearnerDto) => {
    setSelectedLearner(learner);
    setStudentModalMode('view');
    setIsStudentModalOpen(true);
  };

  const submitCreate = async (data: CreateLearnerDto) => {
    if (!canManageLearners) throw new Error('غير مصرح لك بتنفيذ العملية');
    await createLearnerMutation.mutateAsync(data);
  };

  const updateLearner = async (id: string, data: UpdateLearnerDto) => {
    if (!canManageLearners) throw new Error('غير مصرح لك بتنفيذ العملية');
    await updateLearnerMutation.mutateAsync({ id, data });
  };

  const deleteLearner = async (id: string) => {
    if (!canManageLearners) return;
    await deleteLearnerMutation.mutateAsync(id);
  };

  return {
    learners: learnersQuery.data?.data ?? [],
    totalPages: Math.max(learnersQuery.data?.meta?.totalPages ?? 1, 1),
    isLoading: learnersQuery.isPending,
    isRefreshing: learnersQuery.isFetching,
    queryError: learnersQuery.error?.message ?? null,

    page,
    setPage,
    searchQuery,
    onSearchQueryChange: handleSearchQueryChange,

    canManageLearners,

    selectedLearner,
    isStudentModalOpen,
    setIsStudentModalOpen,
    studentModalMode,
    openCreateModal,
    openViewModal,
    submitCreate,

    updateLearner,
    deleteLearner,

    isSubmittingCreate: createLearnerMutation.isPending,
    isUpdatingLearner: updateLearnerMutation.isPending,
    isDeletingLearner: deleteLearnerMutation.isPending,
  };
}
