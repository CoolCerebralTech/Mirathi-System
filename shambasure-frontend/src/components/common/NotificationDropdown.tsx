// FILE: src/components/common/NotificationDropdown.tsx

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useMyNotifications, useUnreadCount, useMarkAsRead, useDeleteNotification } from '../../features/notifications/notifications.api';
import { LoadingSpinner } from './LoadingSpinner';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatRelativeTime } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import type { Notification } from '../../types/schemas';

export function NotificationDropdown() {
  const { data: notificationsData, isLoading, error } = useMyNotifications({ page: 1, limit: 5 });
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.data || [];
  const unreadCount = unreadData?.count || 0;

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAsRead.mutate(notificationId);
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification.mutate(notificationId);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <LoadingSpinner size="sm" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-sm text-center text-destructive">
          Failed to load notifications
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="p-8 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
        </div>
      );
    }

    return (
      <>
        {notifications.map((notification: Notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="flex items-start gap-3 p-3 cursor-pointer"
            asChild
          >
            <Link to={`/dashboard/notifications/${notification.id}`}>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium line-clamp-1">
                    {notification.templateId || 'Notification'}
                  </p>
                  <Badge variant={notification.status === 'SENT' ? 'success' : 'warning'} className="text-xs">
                    {notification.channel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => handleDelete(notification.id, e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
      </>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-lg p-2 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="max-h-[400px] overflow-y-auto">
          {renderContent()}
        </div>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link 
                to="/dashboard/notifications" 
                className="cursor-pointer text-center justify-center font-medium"
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}