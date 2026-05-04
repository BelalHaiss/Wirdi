import { Loader2, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

type StatsCountCardProps = {
  icon: LucideIcon;
  data: { count: number; title: string };
  isLoading: boolean;
  className?: string;
  iconClassName?: string;
};

export function StatsCountCard({
  icon: Icon,
  data,
  isLoading,
  className,
  iconClassName,
}: StatsCountCardProps) {
  return (
    <Card className={cn('relative overflow-hidden border ring-1 shadow-sm', className)}>
      <CardContent className='p-2 md:space-y-4 md:p-5'>
        {/* Mobile layout: column */}
        <div className='flex flex-col items-center gap-1.5 md:hidden'>
          <div
            className={cn(
              'rounded-md bg-muted p-1 text-muted-foreground ring-1 ring-current/10',
              iconClassName
            )}
          >
            <Icon className='h-3 w-3' />
          </div>
          {isLoading ? (
            <Loader2 className='h-3 w-3 animate-spin text-muted-foreground' />
          ) : (
            <div className='text-center'>
              <Typography as='div' size='sm' weight='bold' className='leading-none'>
                {data.count}
              </Typography>
              <Typography
                as='div'
                size='xs'
                className='text-muted-foreground leading-tight mt-0.5 line-clamp-2 text-center'
              >
                {data.title}
              </Typography>
            </div>
          )}
        </div>

        {/* Desktop layout */}
        <div className='hidden items-center justify-between gap-2 md:flex'>
          <div
            className={cn(
              'rounded-lg bg-muted p-2.5 text-muted-foreground ring-1 ring-current/10',
              iconClassName
            )}
          >
            <Icon className='h-5 w-5' />
          </div>
        </div>
        {isLoading ? (
          <div className='hidden md:flex items-center gap-2'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <Typography as='div' size='sm' className='text-muted-foreground'>
              جاري التحميل...
            </Typography>
          </div>
        ) : (
          <div className='hidden space-y-1 md:block'>
            <Typography as='div' size='2xl' weight='bold'>
              {data.count}
            </Typography>
            <Typography as='div' size='sm' weight='semibold'>
              {data.title}
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
