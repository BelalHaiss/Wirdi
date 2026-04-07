import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';

type Props = {
  blockedBy: string; // day name
};

export function BlockedByPreviousDayMessage({ blockedBy }: Props) {
  return (
    <Card className='border-warning/40 bg-warning/5'>
      <CardContent className='pt-6'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='h-5 w-5 text-warning shrink-0 mt-0.5' />
          <Typography size='sm' className='text-muted-foreground'>
            لا يمكنك تسجيل هذا اليوم قبل تسجيل يوم {blockedBy} أولاً.
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}
