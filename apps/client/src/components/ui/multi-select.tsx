import * as React from 'react';
import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = 'اختر...',
  searchPlaceholder = 'بحث...',
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = options.filter(
    (opt) => !value.includes(opt.value) && opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const remove = (optValue: string) => {
    onChange(value.filter((v) => v !== optValue));
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>
        <div
          role='combobox'
          aria-expanded={open}
          aria-haspopup='listbox'
          className={cn(
            'dark:bg-input/30 border-input focus-within:border-ring focus-within:ring-ring/50',
            'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border',
            'bg-transparent px-2.5 py-1.5 text-sm shadow-xs',
            'transition-[color,box-shadow] focus-within:ring-[3px] cursor-text',
            disabled && 'pointer-events-none opacity-50',
            className
          )}
          onClick={() => {
            inputRef.current?.focus();
            setOpen(true);
          }}
        >
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className='bg-muted text-foreground inline-flex h-6 items-center gap-1 rounded-sm px-1.5 text-xs font-medium'
            >
              {opt.label}
              <button
                type='button'
                aria-label={`إزالة ${opt.label}`}
                disabled={disabled}
                className='text-muted-foreground hover:text-foreground rounded-sm transition-opacity'
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  remove(opt.value);
                }}
              >
                <XIcon className='size-3' />
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
                inputRef.current?.blur();
              }
            }}
            disabled={disabled}
            placeholder={value.length === 0 ? placeholder : undefined}
            className='min-w-20 flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm'
            aria-label={searchPlaceholder}
          />

          <ChevronsUpDownIcon className='size-4 shrink-0 text-muted-foreground ms-auto' />
        </div>
      </PopoverPrimitive.Anchor>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={cn(
            'bg-popover text-popover-foreground z-50 max-h-60 w-[--radix-popover-trigger-width]',
            'overflow-y-auto rounded-md border shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {filtered.length === 0 ? (
            <div className='py-6 text-center text-sm text-muted-foreground'>لا توجد نتائج</div>
          ) : (
            <div role='listbox' aria-multiselectable='true'>
              {filtered.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    role='option'
                    aria-selected={isSelected}
                    className='relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground'
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(opt.value)}
                  >
                    <CheckIcon
                      className={cn('size-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                    {opt.label}
                  </div>
                );
              })}
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
