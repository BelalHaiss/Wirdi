import * as React from 'react';
import { BookMarked } from 'lucide-react';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

type AppLogoProps = React.ComponentProps<'div'> & {
  label?: string;
};

export function AppLogo({ className, label = 'الفردوس', ...props }: AppLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)} {...props}>
      <Typography as='div' size='lg' weight='semibold'>
        {label}
      </Typography>
      <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
        <BookMarked className='h-4 w-4' />
      </div>
    </div>
  );
}
