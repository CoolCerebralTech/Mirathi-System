// FILE: src/components/layouts/Header.tsx

import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { SearchBar } from '../common/SearchBar';
import { UserMenu } from '../common/UserMenu';
import { NotificationDropdown } from '../common/NotificationDropdown';

interface HeaderProps {
  // This is a function that the Header will call to toggle the mobile sidebar's state.
  // The state itself is managed by the parent DashboardLayout.
  onMobileNavToggle: () => void;
}

export function Header({ onMobileNavToggle }: HeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Mobile Navigation Toggle - only visible on small screens */}
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 sm:hidden" // Hide on sm screens and up
        onClick={onMobileNavToggle}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
      
      {/* Breadcrumbs - A placeholder for now. This could be a more dynamic component later. */}
      <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
        {/* Example of a second breadcrumb level */}
        {/* <span>/</span>
        <span className="text-foreground">Assets</span> */}
      </div>

      {/* Search Bar and User Components - Pushed to the right */}
      <div className="ml-auto flex items-center gap-4">
        <div className="w-full max-w-sm">
            <SearchBar placeholder="Search..." />
        </div>
        <NotificationDropdown />
        <UserMenu />
      </div>
    </header>
  );
}