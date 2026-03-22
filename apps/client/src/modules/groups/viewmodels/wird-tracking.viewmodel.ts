import { useMemo, useState } from 'react';
import { useApiQuery } from '@/lib/hooks/useApiQuery';
import { queryKeys } from '@/lib/query-client';
import { wirdService } from '../services/wird.service';

export function useWirdTrackingViewModel(groupId: string) {
  const [selectedWeekId, setSelectedWeekId] = useState<string | undefined>(undefined);

  const weeksQuery = useApiQuery({
    queryKey: queryKeys.wirds.weeks(groupId),
    queryFn: () => wirdService.getGroupWeeks(groupId),
  });

  const weeks = useMemo(() => weeksQuery.data?.data ?? [], [weeksQuery.data]);

  // Default is determined entirely by the backend flag — no date logic on the client
  const defaultWeekId = useMemo(() => weeks.find((w) => w.isDefault)?.id, [weeks]);

  const effectiveWeekId = selectedWeekId ?? defaultWeekId;

  const trackingQuery = useApiQuery({
    queryKey: queryKeys.wirds.tracking(groupId, effectiveWeekId ?? ''),
    queryFn: () => wirdService.getWeekTracking(groupId, effectiveWeekId!),
    enabled: !!effectiveWeekId,
  });

  return {
    weeks,
    selectedWeekId: effectiveWeekId,
    setSelectedWeekId,
    trackingRows: trackingQuery.data?.data?.rows ?? [],
    isLoadingWeeks: weeksQuery.isLoading,
    isLoadingTracking: trackingQuery.isLoading,
  };
}
