import { cva, type VariantProps } from 'class-variance-authority';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ReadSourceType, WirdStatus } from '@wirdi/shared';

const cellVariants = cva(
  'relative inline-flex size-6 items-center justify-center rounded-md text-xs font-medium transition-colors',
  {
    variants: {
      status: {
        ATTENDED: 'bg-success text-success-foreground',
        MISSED: 'bg-destructive text-destructive-foreground',
        LATE: 'bg-warning text-warning-foreground',
        FUTURE: 'bg-muted text-muted-foreground',
        EMPTY: 'border border-border bg-transparent text-muted-foreground',
      },
    },
    defaultVariants: { status: 'EMPTY' },
  }
);

type WirdStatusCellProps = VariantProps<typeof cellVariants> & {
  status: WirdStatus;
  readSource?: ReadSourceType;
  readOnMateName?: string;
  className?: string;
};

export function WirdStatusCell({
  status,
  readSource,
  readOnMateName,
  className,
}: WirdStatusCellProps) {
  const shouldShowTooltip = readSource === 'OUTSIDE_GROUP' || !!readOnMateName;

  const content = (
    <div className={cn(cellVariants({ status }), className)}>
      {shouldShowTooltip && (
        <span className='absolute -top-1 -end-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm'>
          <Users className='h-2 w-2' />
        </span>
      )}
    </div>
  );

  if (shouldShowTooltip) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side='top' className='text-xs'>
            {readSource === 'OUTSIDE_GROUP' ? 'سُمع خارج المجموعة' : `سُمع على: ${readOnMateName}`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
