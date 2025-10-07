// FILE: src/components/common/SearchBar.tsx

import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Input, type InputProps } from '../ui/Input'; // We import our base Input component

// --- Helper Icon for the Search Symbol ---
const SearchIcon = (props: React.SVGAttributes<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);


// 1. Define the props for our SearchBar.
//    It will accept all the same props as a standard Input.
export interface SearchBarProps extends InputProps {}


// 2. Create the SearchBar component.
const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, ...props }, ref) => {
    
    // We use a relative container to position the search icon.
    return (
      <div className={twMerge(clsx('relative w-full', className))}>
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        {/* We render our base Input component and add padding to the left
            to make space for the icon, so the text doesn't overlap. */}
        <Input
          type="search"
          className="pl-9" // Add padding on the left for the icon
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
SearchBar.displayName = 'SearchBar';

export { SearchBar };