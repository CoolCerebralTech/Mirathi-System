// FILE: src/components/common/SearchBar.tsx

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn, debounce } from '../../lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  className,
}: SearchBarProps) {
  const [localValue, setLocalValue] = React.useState(value);

  // Debounced search
  const debouncedSearch = React.useMemo(
    () => debounce((searchValue: string) => {
      onChange(searchValue);
      onSearch?.(searchValue);
    }, debounceMs),
    [onChange, onSearch, debounceMs]
  );

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onSearch?.('');
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        leftIcon={<Search className="h-4 w-4" />}
        className="pr-10"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
