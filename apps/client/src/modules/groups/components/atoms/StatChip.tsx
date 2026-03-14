import type { LucideIcon } from 'lucide-react';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

type StatChipProps = {
  icon: LucideIcon;
  label: string;
  className?: string;
};

/**
 * A small pill showing an icon + label — reusable for member count, awrad list, etc.
 */
export function StatChip({ icon: Icon, label, className }: StatChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-secondary-foreground',
        className
      )}
    >
      <Icon className='h-3.5 w-3.5 text-primary' />
      <Typography size='sm' className='text-secondary-foreground'>
        {label}
      </Typography>
    </div>
  );
}
