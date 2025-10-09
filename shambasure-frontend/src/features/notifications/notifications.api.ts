// FILE: src/features/notifications/notifications.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  Notification,
  NotificationQuery,
  PaginatedResponse,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationQuery) => [...notificationKeys.lists(), filters] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getMyNotifications = async (params: NotificationQuery): Promise<PaginatedResponse<Notification>> => {
  const response = await apiClient.get('/notifications', { params });
  return response.data;
};

const getNotificationById = async (notificationId: string): Promise<Notification> => {
  const response = await apiClient.get(`/notifications/${notificationId}`);
  return response.data;
};

const getUnreadCount = async (): Promise<{ count: number }> => {
  const response = await apiClient.get('/notifications/unread/count');
  return response.data;
};

const markAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await apiClient.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

const markAllAsRead = async (): Promise<{ updated: number }> => {
  const response = await apiClient.patch('/notifications/read-all');
  return response.data;
};

const deleteNotification = async (notificationId: string): Promise<void> => {
  await apiClient.delete(`/notifications/${notificationId}`);
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch the current user's notifications with pagination
 * Supports filtering by status and channel
 * 
 * @example
 * const { data: notificationsPage, isLoading } = useMyNotifications({ 
 *   page: 1, 
 *   status: 'SENT' 
 * });
 */
export const useMyNotifications = (params: NotificationQuery = {}) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => getMyNotifications(params),
    enabled: status === 'authenticated',
    staleTime: 30 * 1000, // 30 seconds - notifications should be relatively fresh
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch a single notification by ID
 * 
 * @example
 * const { data: notification, isLoading } = useNotification(notificationId);
 */
export const useNotification = (notificationId: string) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: notificationKeys.detail(notificationId),
    queryFn: () => getNotificationById(notificationId),
    enabled: status === 'authenticated' && !!notificationId,
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Hook to get the count of unread notifications
 * Auto-refreshes every minute for real-time updates
 * 
 * @example
 * const { data: unreadData } = useUnreadCount();
 * // unreadData.count => 5
 */
export const useUnreadCount = () => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    enabled: status === 'authenticated',
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Hook to mark a notification as read
 * 
 * @example
 * const markReadMutation = useMarkAsRead();
 * markReadMutation.mutate(notificationId);
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: (_data, notificationId) => {
      // Update the specific notification
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(notificationId) });
      
      // Update all notification lists
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      
      // Update unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
    onError: (error) => {
      console.error('Mark as read failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to mark all notifications as read
 * 
 * @example
 * const markAllReadMutation = useMarkAllAsRead();
 * markAllReadMutation.mutate();
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error) => {
      console.error('Mark all as read failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to delete a notification
 * 
 * @example
 * const deleteMutation = useDeleteNotification();
 * deleteMutation.mutate(notificationId);
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: (_data, notificationId) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.removeQueries({ queryKey: notificationKeys.detail(notificationId) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
    onError: (error) => {
      console.error('Delete notification failed:', extractErrorMessage(error));
    },
  });
};