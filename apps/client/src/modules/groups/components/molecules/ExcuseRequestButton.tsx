import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';

export function AllRecordedMessage() {
  return (
    <Card className='border-success/40 bg-success/5'>
      <CardContent className='pt-6 text-center'>
        <Typography as='div' size='sm' className='text-success font-medium'>
          أحسنت! تم تسجيل جميع أيام الأسبوع ✓
        </Typography>
      </CardContent>
    </Card>
  );
}
