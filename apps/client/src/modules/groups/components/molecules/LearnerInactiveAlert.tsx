import { AlertTriangle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';

type Props = {
  activeExcuseExpiresAt?: string | null;
  onRequestActivation: () => void;
};

export function LearnerInactiveAlert({ onRequestActivation }: Props) {
  return (
    <Card className='border-danger/40 bg-danger/5'>
      <CardContent className='pt-6 space-y-4'>
        <div className='flex items-start gap-4'>
          <div className='rounded-full bg-danger/10 p-3 shrink-0'>
            <AlertTriangle className='h-6 w-6 text-danger' />
          </div>
          <div className='flex-1 space-y-2'>
            <Typography weight='medium' className='text-danger'>
              تم إيقاف حسابك
            </Typography>
            <Typography size='sm' className='text-muted-foreground'>
              لقد تم إيقاف حسابك مؤقتاً بسبب عدم المداومة. يمكنك طلب التفعيل مجدداً من خلال الزر
              أدناه.
            </Typography>
          </div>
        </div>
        <div className='flex gap-2 flex-wrap'>
          <Button
            variant='outline'
            color='primary'
            size='sm'
            className='gap-2'
            onClick={onRequestActivation}
          >
            <LogIn className='h-4 w-4' />
            طلب التفعيل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
