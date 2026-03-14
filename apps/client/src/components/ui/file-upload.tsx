'use client';

import * as React from 'react';
import { UploadCloud, X, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';

type FileUploadProps = {
  accept?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

/**
 * A simple, styled file upload drop zone.
 * Displays a preview name when a file is selected and allows clearing.
 */
export function FileUpload({
  accept = 'image/*',
  value,
  onChange,
  disabled,
  className,
  placeholder = 'اسحب الصورة هنا أو اضغط للاختيار',
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleFile = (file: File | null) => {
    if (!file) return;
    onChange(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div
      role='button'
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        ref={inputRef}
        type='file'
        accept={accept}
        className='sr-only'
        disabled={disabled}
        onChange={handleInputChange}
      />

      {value ? (
        <div className='flex items-center gap-3 w-full justify-between'>
          <div className='flex items-center gap-2 min-w-0'>
            <FileImage className='h-5 w-5 text-primary shrink-0' />
            <Typography size='sm' className='truncate text-foreground'>
              {value.name}
            </Typography>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-7 w-7 shrink-0'
            onClick={handleClear}
            disabled={disabled}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      ) : (
        <>
          <UploadCloud className='h-8 w-8 text-muted-foreground' />
          <Typography size='sm' className='text-muted-foreground text-center'>
            {placeholder}
          </Typography>
        </>
      )}
    </div>
  );
}
