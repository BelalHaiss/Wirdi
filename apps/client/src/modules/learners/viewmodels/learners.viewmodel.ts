import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import {
  formatDate,
  getNowAsUTC,
  type CreateLearnerDto,
  type LearnerDto,
  type UpdateLearnerDto,
} from '@wirdi/shared';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { useApiMutation } from '@/lib/hooks/useApiMutation';
import { useApiQuery } from '@/lib/hooks/useApiQuery';
import { queryClient, queryKeys } from '@/lib/query-client';
import { learnerService } from '../services/learner.service';

export type LearnerModalMode = 'view' | 'create';

export function useLearnersViewModel() {
  const { user } = useApp();
  const canManageLearners = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const [searchQuery, setSearchQueryState] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<LearnerDto | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState<LearnerModalMode>('view');

  const activeSort = sorting[0];
  const sortBy = activeSort?.id;
  const sortOrder = activeSort ? (activeSort.desc ? 'desc' : 'asc') : undefined;

  const learnersQuery = useApiQuery<LearnerDto[]>({
    queryKey: queryKeys.learners.list({
      page,
      limit,
      search: searchQuery || undefined,
      sortBy,
      sortOrder,
    }),
    queryFn: () =>
      learnerService.queryLearners({
        page,
        limit,
        search: searchQuery || undefined,
        sortBy,
        sortOrder,
      }),
    placeholderData: (previousData) => previousData,
  });

  const createLearnerMutation = useApiMutation<CreateLearnerDto, LearnerDto>({
    mutationFn: learnerService.createLearner,
    onSuccess: async () => {
      toast.success('تمت إضافة الطالب بنجاح');
      await queryClient.invalidateQueries({ queryKey: queryKeys.learners.all });
    },
  });

  const updateLearnerMutation = useApiMutation<{ id: string; data: UpdateLearnerDto }, LearnerDto>({
    mutationFn: ({ id, data }) => learnerService.updateLearner(id, data),
    onSuccess: async () => {
      toast.success('تم تعديل بيانات الطالب بنجاح');
      await queryClient.invalidateQueries({ queryKey: queryKeys.learners.all });
    },
  });

  const deleteLearnerMutation = useApiMutation<string, null>({
    mutationFn: (learnerId: string) => learnerService.deleteLearner(learnerId),
    onSuccess: async () => {
      toast.success('تم حذف الطالب بنجاح');
      await queryClient.invalidateQueries({ queryKey: queryKeys.learners.all });
    },
  });

  const handleSearchQueryChange = (value: string) => {
    setSearchQueryState(value);
    setPage(1);
  };

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const handleSortingChange = (nextSorting: SortingState) => {
    setSorting(nextSorting);
    setPage(1);
  };

  // TanStack Table compatible updater function
  const handleSortingChangeTable = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState)
  ) => {
    const nextSorting =
      typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;
    setSorting(nextSorting);
    setPage(1);
  };

  const handleExportLearners = async () => {
    if (!canManageLearners) return;

    try {
      setIsExporting(true);
      const csvBlob = await learnerService.exportLearnersCsv();
      const url = URL.createObjectURL(csvBlob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const exportDate = formatDate({ date: getNowAsUTC(), token: 'yyyy-MM-dd' });
      anchor.download = `learners-${exportDate}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('تم تصدير بيانات الطلاب بنجاح');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر تصدير بيانات الطلاب';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
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
    limit,
    setLimit: handleLimitChange,
    sorting,
    setSorting: handleSortingChange,
    setSortingTable: handleSortingChangeTable,
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
    handleExportLearners,
    isExporting,
  };
}
