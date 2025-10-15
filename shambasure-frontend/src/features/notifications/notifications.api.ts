// FILE: src/features/notifications/notifications.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import {
  type Notification,
  NotificationSchema,
  type NotificationQuery,
  type MarkNotificationsAsReadInput,
  type SuccessResponse,
  SuccessResponseSchema,
  type Paginated,
  createPaginatedResponseSchema,
} from '../../types';
import { z } from 'zod';
import { toast } from 'sonner';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API ENDPOINTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ApiEndpoints = {
  NOTIFICATIONS: '/notifications',
  MARK_AS_READ: '/notifications/read',
  STATS: '/notifications/stats',
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// QUERY KEY FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationQuery) => [...notificationKeys.lists(), filters] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SCHEMAS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const NotificationStatsSchema = z.object({
  unreadCount: z.number().int().nonnegative(),
});
type NotificationStats = z.infer<typeof NotificationStatsSchema>;

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const getNotifications = async (
  params: NotificationQuery,
): Promise<Paginated<Notification>> => {
  const { data } = await apiClient.get(ApiEndpoints.NOTIFICATIONS, { params });
  return createPaginatedResponseSchema(NotificationSchema).parse(data);
};

const getNotificationStats = async (): Promise<NotificationStats> => {
  const { data } = await apiClient.get(ApiEndpoints.STATS);
  return NotificationStatsSchema.parse(data);
};

const markNotificationsAsRead = async (
  readData: MarkNotificationsAsReadInput,
): Promise<SuccessResponse> => {
  const { data } = await apiClient.post(ApiEndpoints.MARK_AS_READ, readData);
  return SuccessResponseSchema.parse(data);
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REACT QUERY HOOKS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const useNotifications = (params: NotificationQuery = {}) =>
  useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => getNotifications(params),
  });

export const useNotificationStats = () =>
  useQuery({
    queryKey: notificationKeys.stats(),
    queryFn: getNotificationStats,
  });

export const useMarkNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsAsRead,
    onMutate: async ({ notificationIds }) => {
      // Optimistically update the UI
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      // Update stats
      queryClient.setQueryData<NotificationStats>(
        notificationKeys.stats(),
        (old) => (old ? { ...old, unreadCount: 0 } : undefined),
      );

      // Update notification lists
      queryClient.setQueriesData<Paginated<Notification>>(
        { queryKey: notificationKeys.lists() },
        (oldData) => {
          if (!oldData) return undefined;
          return {
            ...oldData,
            data: oldData.data.map((notif) =>
              notificationIds?.includes(notif.id) || !notificationIds
                ? { ...notif, readAt: new Date() }
                : notif,
            ),
          };
        },
      );
    },
    onError: (error) => {
      // On error, invalidate all queries to roll back to the server state
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.error(extractErrorMessage(error));
    },
    onSuccess: () => {
      toast.success('Notifications marked as read');
    },
    onSettled: () => {
      // For good measure, refetch all notification data after mutation is settled
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * A convenience hook that uses `useMarkNotificationsAsRead` to mark all notifications as read.
 */
export const useMarkAllNotificationsAsRead = () => {
  const { mutate, ...rest } = useMarkNotificationsAsRead();
  return {
    markAllAsRead: () => mutate({ notificationIds: [] }),
    ...rest,
  };
};