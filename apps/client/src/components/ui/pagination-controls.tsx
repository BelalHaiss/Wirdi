import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type PaginationControlsProps = {
  value: number;
  totalPages: number;
  onValueChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  disabled?: boolean;
  className?: string;
};

export function PaginationControls({
  value,
  totalPages,
  onValueChange,
  limit,
  onLimitChange,
  limitOptions = [10, 25, 50],
  disabled = false,
  className,
}: PaginationControlsProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const safeCurrentPage = Math.min(Math.max(value, 1), safeTotalPages);
  const canGoNext = safeCurrentPage < safeTotalPages && !disabled;
  const canGoPrevious = safeCurrentPage > 1 && !disabled;

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      {onLimitChange ? (
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>عدد الصفوف</span>
          <Select
            value={String(limit ?? limitOptions[0])}
            onValueChange={(nextValue) => onLimitChange(Number(nextValue))}
            disabled={disabled}
          >
            <SelectTrigger className='w-24'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div />
      )}

      <Button
        variant='outline'
        color='muted'
        size='sm'
        disabled={!canGoPrevious}
        onClick={() => onValueChange(safeCurrentPage - 1)}
      >
        السابق
      </Button>

      <span className='text-sm text-muted-foreground'>
        صفحة {safeCurrentPage} من {safeTotalPages}
      </span>

      <Button
        variant='outline'
        color='muted'
        size='sm'
        disabled={!canGoNext}
        onClick={() => onValueChange(safeCurrentPage + 1)}
      >
        التالي
      </Button>
    </div>
  );
}
