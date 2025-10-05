// src/components/common/SearchBar.tsx
// ============================================================================
// Global Search Bar Component
// ============================================================================
// - A styled search input field for use in headers or data tables.
// - Includes a search icon for better usability.
// - It is a controlled component, managed by parent state via the `value`
//   and `onChange` props.
// ============================================================================

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import type { ChangeEvent } from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = 'Search...' }: SearchBarProps) => {
    return (
        <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
                type="text"
                name="search"
                id="search"
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder={placeholder}
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            />
        </div>
    );
};