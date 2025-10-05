// src/components/layout/Header.tsx
// ============================================================================
// Main Application Header for Authenticated Layout
// ============================================================================
// - The top navigation bar displayed to logged-in users.
// - Integrates our common components: `SearchBar`, `NotificationDropdown`,
//   and `UserMenu` for a fully functional header experience.
// ============================================================================

import { useState } from 'react';
import { SearchBar } from '../common/SearchBar';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { UserMenu } from '../common/UserMenu';

export const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Search Bar */}
            <div className="w-full max-w-xs">
                <SearchBar 
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search documents, wills..."
                />
            </div>

            {/* Right-side actions */}
            <div className="flex items-center gap-x-4">
                <NotificationDropdown />
                <div className="h-6 w-px bg-gray-200" aria-hidden="true" />
                <UserMenu />
            </div>
        </header>
    );
};