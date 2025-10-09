// FILE: src/components/layouts/Header.tsx

import * as React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { UserMenu } from '../common/UserMenu';
import { NotificationDropdown } from '../common/NotificationDropdown';

interface HeaderProps {
  onMobileNavToggle: () => void;
}

export function Header({ onMobileNavToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={onMobileNavToggle}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        <NotificationDropdown />
        <UserMenu />
      </div>
    </header>
  );
}