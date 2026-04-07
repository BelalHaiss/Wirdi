import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  onClick: () => void;
};

export function ExcuseRequestButton({ onClick }: Props) {
  return (
    <Card>
      <CardContent className='pt-6'>
        <Button variant='outline' color='primary' className='gap-2' onClick={onClick}>
          <FileText className='h-4 w-4' />
          طلب عذر
        </Button>
      </CardContent>
    </Card>
  );
}
