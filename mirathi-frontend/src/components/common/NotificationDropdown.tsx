// FILE: src/components/common/NotificationDropdown.tsx

import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Check, MailCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useNotifications, useNotificationStats, useMarkNotificationsAsRead } from '../../features/notifications/notifications.api';
import { LoadingSpinner } from './LoadingSpinner';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

/**
 * A self-contained dropdown component for displaying user notifications.
 * It fetches notification data, displays a list, and handles marking notifications as read.
 */
export function NotificationDropdown() {
  const { t } = useTranslation(['header', 'common']);
  const { data: notificationsData, isLoading } = useNotifications({ limit: 7 });
  const { data: stats } = useNotificationStats();
  const { mutate: markAsRead } = useMarkNotificationsAsRead();

  const notifications = notificationsData?.data ?? [];
  const unreadCount = stats?.unreadCount ?? 0;

  const handleMarkOneAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    markAsRead({ notificationIds: [notificationId] });
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    markAsRead({ notificationIds: [] }); // Empty array marks all
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>;
    }
    if (notifications.length === 0) {
      return (
        <div className="p-8 text-center text-sm text-muted-foreground">
          <Bell className="mx-auto h-8 w-8" />
          <p className="mt-2">{t('no_notifications')}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col">
        {notifications.map((n) => (
          <DropdownMenuItem key={n.id} asChild className="p-0">
            <Link to={n.link || '#'} className={`flex items-start gap-3 p-3 transition-colors hover:bg-accent ${!n.readAt ? 'bg-accent/50' : ''}`}>
              {!n.readAt && <div className="mt-1 h-2 w-2 rounded-full bg-primary" />}
              <div className={`flex-1 space-y-1 ${!n.readAt ? 'pl-0' : 'pl-4'}`}>
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                <p className="text-xs text-blue-500">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              {!n.readAt && (
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => handleMarkOneAsRead(n.id, e)} aria-label={t('mark_as_read')}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </div>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <DropdownMenuLabel className="flex items-center justify-between p-3">
          <span className="font-semibold">{t('notifications')}</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleMarkAllAsRead}>
              <MailCheck className="mr-1 h-3 w-3" />
              {t('mark_all_as_read')}
            </Button>
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
              <Link to="/notifications" className="cursor-pointer justify-center py-2 text-sm font-medium text-primary">
                {t('view_all_notifications')}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
