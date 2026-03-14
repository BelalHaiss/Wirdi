import * as React from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreatableComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
  /** Predefined suggestions shown in the dropdown. */
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Label shown next to the plus icon when creating a new item. Defaults to the typed value. */
  createLabel?: (inputValue: string) => string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreatableCombobox({
  value,
  onChange,
  suggestions = [],
  placeholder = 'اكتب للبحث أو الإضافة...',
  disabled = false,
  className,
  createLabel = (v) => `إضافة "${v}"`,
}: CreatableComboboxProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter(
    (s) => !value.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  const canCreate =
    inputValue.trim() !== '' &&
    !suggestions.some((s) => s.toLowerCase() === inputValue.trim().toLowerCase()) &&
    !value.includes(inputValue.trim());

  const showDropdown = open && (filtered.length > 0 || canCreate);

  const addItem = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeItem = (item: string) => {
    onChange(value.filter((v) => v !== item));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exactMatch = filtered.find((s) => s.toLowerCase() === inputValue.trim().toLowerCase());
      if (exactMatch) {
        addItem(exactMatch);
      } else if (canCreate) {
        addItem(inputValue);
      } else if (filtered.length === 1) {
        addItem(filtered[0]);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeItem(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <PopoverPrimitive.Root open={showDropdown} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>
        <div
          ref={containerRef}
          role='combobox'
          aria-expanded={showDropdown}
          aria-haspopup='listbox'
          className={cn(
            'dark:bg-input/30 border-input focus-within:border-ring focus-within:ring-ring/50',
            'has-aria-invalid:ring-destructive/20 has-aria-invalid:border-destructive',
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
          {value.map((v) => (
            <span
              key={v}
              className='bg-muted text-foreground inline-flex h-6 items-center gap-1 rounded-sm px-1.5 text-xs font-medium'
            >
              {v}
              <button
                type='button'
                aria-label={`إزالة ${v}`}
                disabled={disabled}
                className='text-muted-foreground hover:text-foreground rounded-sm transition-opacity'
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(v);
                }}
              >
                <XIcon className='size-3' />
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // small delay so click on list items fires first
              setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={disabled}
            className='min-w-20 flex-1 bg-transparent outline-none placeholder:text-muted-foreground'
            autoComplete='off'
          />
        </div>
      </PopoverPrimitive.Anchor>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          role='listbox'
          sideOffset={6}
          align='start'
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={() => setOpen(false)}
          className={cn(
            'bg-popover text-popover-foreground z-50 overflow-hidden rounded-md border shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'w-(--radix-popover-trigger-width) p-1'
          )}
          style={{ minWidth: containerRef.current?.offsetWidth }}
        >
          {filtered.map((opt) => (
            <button
              key={opt}
              type='button'
              role='option'
              className='flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground'
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addItem(opt)}
            >
              {opt}
            </button>
          ))}

          {canCreate && (
            <button
              type='button'
              role='option'
              className='text-muted-foreground flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground'
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addItem(inputValue)}
            >
              <PlusIcon className='size-3.5 shrink-0' />
              {createLabel(inputValue)}
            </button>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
