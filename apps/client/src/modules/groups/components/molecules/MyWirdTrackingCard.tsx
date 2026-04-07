import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WirdTrackingTable } from '../organisms/WirdTrackingTable';
import type { GroupWirdTrackingRowDto, TimeZoneType } from '@wirdi/shared';

type Props = {
  row: GroupWirdTrackingRowDto;
  weekId: string;
  groupId: string;
  userTimezone: TimeZoneType;
};

export function MyWirdTrackingCard({ row, weekId, groupId, userTimezone }: Props) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base'>سجل وردك</CardTitle>
      </CardHeader>
      <CardContent>
        <WirdTrackingTable
          rows={[row]}
          isLoading={false}
          weekId={weekId}
          groupId={groupId}
          userTimezone={userTimezone}
          canManage={false}
        />
      </CardContent>
    </Card>
  );
}
