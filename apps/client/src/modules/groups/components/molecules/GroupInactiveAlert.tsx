import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';

export function GroupInactiveAlert() {
  return (
    <Card className='border-warning/40 bg-warning/5'>
      <CardContent className='pt-6 space-y-4'>
        <div className='flex items-start gap-4'>
          <div className='rounded-full bg-warning/10 p-3 shrink-0'>
            <AlertTriangle className='h-6 w-6 text-warning' />
          </div>
          <div className='flex-1 space-y-2'>
            <Typography weight='medium' className='text-warning'>
              المجموعة غير فعّالة
            </Typography>
            <Typography size='sm' className='text-muted-foreground'>
              هذه المجموعة غير فعّالة حالياً. لا يمكن تسجيل الورد في الوقت الحالي.
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
