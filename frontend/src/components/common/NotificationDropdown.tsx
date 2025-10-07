// FILE: src/components/common/NotificationDropdown.tsx

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';
import { useMyNotifications } from '../../features/notifications/notifications.api'; // Our data-fetching hook
import { LoadingSpinner } from './LoadingSpinner'; // Our loading indicator
import type { Notification } from '../../types'; // Our Notification type

// --- Helper Icon for the Bell ---
const BellIcon = (props: React.SVGAttributes<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);


// 1. We'll reuse the same styled Radix components from UserMenu.
//    In a real project, these could be moved to a single ui/Dropdown.tsx file to avoid duplication.
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={twMerge(clsx('z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2', className))}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={twMerge(clsx('relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent data-[disabled]:opacity-50', className))}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Label ref={ref} className={twMerge(clsx('px-2 py-1.5 text-sm font-semibold', className))} {...props} />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;


// 2. The main NotificationDropdown component
export function NotificationDropdown() {
  // Fetch the user's notifications using our hook.
  // We'll fetch the first 5 as a preview.
  const { data, isLoading, error } = useMyNotifications({ page: 1, limit: 5 });

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center p-4"><LoadingSpinner /></div>;
    }

    if (error) {
      return <div className="p-2 text-sm text-destructive">Failed to load notifications.</div>;
    }
    
    const notifications = data?.data || [];

    if (notifications.length === 0) {
      return <div className="p-2 text-sm text-muted-foreground">No new notifications.</div>;
    }

    return notifications.map((notification: Notification) => (
      <DropdownMenuItem key={notification.id} asChild>
        <Link to={`/notifications/${notification.id}`} className="flex flex-col items-start">
            <p className="font-semibold">{notification.templateName.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, s => s.toUpperCase())}</p>
            <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
        </Link>
      </DropdownMenuItem>
    ));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <BellIcon className="h-5 w-5" />
            {/* We can add a badge for unread notifications later */}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        {renderContent()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}