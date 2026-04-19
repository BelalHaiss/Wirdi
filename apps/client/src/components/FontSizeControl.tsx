import { Minus, Plus, Type } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';

export function FontSizeControl() {
  const {
    fontScale,
    increaseFontSize,
    decreaseFontSize,
    canIncreaseFontSize,
    canDecreaseFontSize,
  } = useTheme();

  return (
    <div className='flex items-center justify-between gap-1.5 rounded-md border border-border/80 bg-muted/20 px-2 py-1.5'>
      <div className='flex items-center gap-1 text-muted-foreground'>
        <Type className='h-3.5 w-3.5' />
        <Typography as='span' size='xs'>
          الخط
        </Typography>
      </div>

      <div className='flex items-center gap-1'>
        <Button
          onClick={decreaseFontSize}
          variant='ghost'
          color='muted'
          size='icon-xs'
          disabled={!canDecreaseFontSize}
          aria-label='تصغير الخط'
        >
          <Minus className='h-3.5 w-3.5' />
        </Button>

        <Typography
          as='span'
          size='xs'
          className='min-w-10 rounded-sm bg-card px-1.5 py-0.5 text-center text-muted-foreground'
        >
          {fontScale}%
        </Typography>

        <Button
          onClick={increaseFontSize}
          variant='ghost'
          color='muted'
          size='icon-xs'
          disabled={!canIncreaseFontSize}
          aria-label='تكبير الخط'
        >
          <Plus className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  );
}
