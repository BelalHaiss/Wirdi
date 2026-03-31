import { BellOff } from 'lucide-react';
import { Typography } from '@/components/ui/typography';

export function NotificationEmptyState() {
  return (
    <div className='flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground'>
      <div className='w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center'>
        <BellOff className='w-8 h-8' />
      </div>
      <div className='text-center space-y-1'>
        <Typography as='p' size='sm' className='font-medium'>
          لا توجد إشعارات جديدة
        </Typography>
        <Typography as='p' size='xs' className='text-muted-foreground/60'>
          سيتم عرض الإشعارات الجديدة هنا
        </Typography>
      </div>
    </div>
  );
}
