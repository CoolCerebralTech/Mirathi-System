// FILE: src/features/notifications/notifications.api.ts (New)
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: any) => [...notificationKeys.lists(), filters] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

const getMyNotifications = async (params: any): Promise<any> => {
  const response = await apiClient.get('/notifications', { params });
  return response.data;
};
const getMyNotificationStats = async (): Promise<any> => {
  const response = await apiClient.get('/notifications/stats');
  return response.data;
};

export const useMyNotifications = (params: any = {}) => useQuery({ queryKey: notificationKeys.list(params), queryFn: () => getMyNotifications(params) });
export const useMyNotificationStats = () => useQuery({ queryKey: notificationKeys.stats(), queryFn: getMyNotificationStats });