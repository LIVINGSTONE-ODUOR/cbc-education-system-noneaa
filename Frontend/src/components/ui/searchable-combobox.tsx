import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional secondary text rendered next to the label (e.g. designation, branch). */
  description?: string;
}

interface SearchableComboboxProps {
  id?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  loadingText?: string;
  className?: string;
  /**
   * When true, if the typed search text doesn't match any option, the user
   * can pick "Use '<text>'" to set the raw typed value instead of picking
   * from the list. Useful for fields (like Room) that are backed by a
   * suggestion list but should still accept a free-text value.
   */
  allowCustomValue?: boolean;
  'aria-invalid'?: boolean;
}

/**
 * A searchable, type-to-filter dropdown built on top of the existing
 * Popover + Command (cmdk) primitives. Behaves like a native <select> for
 * form purposes (controlled value + onChange) but lets the user filter a
 * long list by typing instead of scrolling.
 */
export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  id,
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  icon,
  loading = false,
  disabled = false,
  loadingText = 'Loading...',
  className,
  allowCustomValue = false,
  ...rest
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selected = React.useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch('');
      onBlur?.();
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setSearch('');
    onBlur?.();
  };

  const handleUseCustom = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setOpen(false);
    setSearch('');
    onBlur?.();
  };

  const trimmedSearch = search.trim();
  const hasExactMatch = options.some(
    (o) => o.label.toLowerCase() === trimmedSearch.toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          onBlur={() => {
            if (!open) onBlur?.();
          }}
          className={cn(
            'w-full justify-between rounded-xl h-10 font-normal border-input',
            !selected && 'text-muted-foreground',
            className
          )}
          {...rest}
        >
          <span className="flex items-center gap-2 truncate">
            {icon}
            <span className="truncate">
              {loading
                ? loadingText
                : selected
                  ? selected.label
                  : value || placeholder}
            </span>
          </span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustomValue && trimmedSearch ? (
                <button
                  type="button"
                  onClick={handleUseCustom}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="h-3.5 w-3.5 text-gray-400" />
                  Use "{trimmedSearch}"
                </button>
              ) : (
                <span className="text-gray-500">{emptyText}</span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.description && (
                    <span className="ml-2 shrink-0 text-xs text-gray-400">
                      {option.description}
                    </span>
                  )}
                </CommandItem>
              ))}
              {allowCustomValue && trimmedSearch && !hasExactMatch && options.length > 0 && (
                <CommandItem value={`__custom__${trimmedSearch}`} onSelect={handleUseCustom}>
                  <Plus className="mr-2 h-4 w-4 text-gray-400" />
                  Use "{trimmedSearch}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableCombobox;
