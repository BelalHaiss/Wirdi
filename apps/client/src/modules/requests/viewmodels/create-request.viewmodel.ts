import { useState } from 'react';
import { toast } from 'sonner';
import { useApiQuery } from '@/lib/hooks/useApiQuery';
import { useApiMutation } from '@/lib/hooks/useApiMutation';
import { queryClient, queryKeys } from '@/lib/query-client';
import { requestService } from '../services/request.service';
import { groupService } from '@/modules/groups';
import { useApp } from '@/contexts/AppContext';
import type {
  RequestType,
  GroupDto,
  ISODateOnlyString,
  ISODateString,
  CreateRequestDto,
  RequestDto,
} from '@wirdi/shared';

export function useCreateRequestViewModel(
  type: RequestType,
  isOpen: boolean,
  defaultGroupId?: string
) {
  const { user } = useApp();
  const [selectedGroupId, setSelectedGroupId] = useState<string>(defaultGroupId ?? '');
  const [expiryDate, setExpiryDate] = useState<ISODateOnlyString | undefined>();
  const [expiryTime, setExpiryTime] = useState<string>('23:59');
  const [reason, setReason] = useState<string>('');

  // Fetch all groups for learner if EXCUSE, or only inactive groups if ACTIVATION
  const groupsQuery = useApiQuery<GroupDto[]>({
    queryKey:
      type === 'EXCUSE' ? queryKeys.groups.myGroups() : queryKeys.groups.eligibleForActivation(),
    queryFn: () =>
      type === 'EXCUSE' ? groupService.getMyGroups() : groupService.getEligibleActivationGroups(),
    enabled: isOpen,
  });

  const createMutation = useApiMutation<CreateRequestDto, RequestDto>({
    mutationFn: (dto) =>
      dto.type === 'EXCUSE'
        ? requestService.createExcuseRequest(dto as CreateRequestDto<'EXCUSE'>)
        : requestService.createActivationRequest(dto as CreateRequestDto<'ACTIVATION'>),
    onSuccess: () => {
      toast.success(type === 'EXCUSE' ? 'تم إرسال طلب العذر بنجاح' : 'تم إرسال طلب التفعيل بنجاح');
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myList() });
      // Reset form
      setSelectedGroupId(defaultGroupId ?? '');
      setExpiryDate(undefined);
      setExpiryTime('23:59');
      setReason('');
    },
    onError: (err) => toast.error(err.message ?? 'حدث خطأ'),
  });

  const handleSubmit = () => {
    if (!selectedGroupId) {
      toast.error('الرجاء اختيار المجموعة');
      return;
    }

    if (type === 'EXCUSE') {
      if (!expiryDate) {
        toast.error('الرجاء اختيار تاريخ انتهاء العذر');
        return;
      }

      // Construct ISO datetime string from date and time
      const expiresAt = `${expiryDate}T${expiryTime}:00.000Z` as ISODateString;

      const dto: CreateRequestDto<'EXCUSE'> = {
        type: 'EXCUSE',
        payload: {
          groupId: selectedGroupId,
          expiresAt,
          reason: reason.trim(),
        },
      };
      createMutation.mutate(dto);
    } else {
      const dto: CreateRequestDto<'ACTIVATION'> = {
        type: 'ACTIVATION',
        payload: {
          groupId: selectedGroupId,
        },
      };
      createMutation.mutate(dto);
    }
  };

  const groups = groupsQuery.data?.data ?? [];
  const isSubmitting = createMutation.isPending;

  return {
    groups,
    isLoading: groupsQuery.isLoading,
    selectedGroupId,
    setSelectedGroupId,
    expiryDate,
    setExpiryDate,
    expiryTime,
    setExpiryTime,
    reason,
    setReason,
    handleSubmit,
    isSubmitting,
    userTimezone: user?.timezone ?? 'UTC',
  };
}
