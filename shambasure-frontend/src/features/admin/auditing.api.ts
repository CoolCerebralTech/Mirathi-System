/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: src/features/admin/auditing.api.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type { AuditLog, AuditQuery } from '../../types';
import type { PaginatedResponse } from '../../types';

// ============================================================================
// QUERY KEYS FACTORY (Your implementation is good)
// ============================================================================

export const auditKeys = {
  all: ['auditing'] as const,
  logs: () => [...auditKeys.all, 'logs'] as const,
  log: (filters: Partial<AuditQuery>) => [...auditKeys.logs(), filters] as const,
  summaries: () => [...auditKeys.all, 'summaries'] as const,
  summary: (params: Pick<AuditQuery, 'startDate' | 'endDate'>) => [...auditKeys.summaries(), params] as const,
  analytics: () => [...auditKeys.all, 'analytics'] as const,
  analytic: (type: string, params: any) => [...auditKeys.analytics(), type, params] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

// UPGRADE: All functions are now fully type-safe
const getAuditLogs = async (params: Partial<AuditQuery>): Promise<PaginatedResponse<AuditLog>> => {
  const response = await apiClient.get('/auditing/logs', { params });
  return response.data;
};

const getAuditSummary = async (params: Pick<AuditQuery, 'startDate' | 'endDate'>): Promise<any> => {
  const response = await apiClient.get('/auditing/summary', { params });
  return response.data;
};

const getAnalytics = async (type: 'trends' | 'top-users' | 'top-actions', params: any): Promise<any> => {
  const response = await apiClient.get(`/auditing/analytics/${type}`, { params });
  return response.data;
};

const exportCsv = async (params: Pick<AuditQuery, 'startDate' | 'endDate'>): Promise<void> => {
  const response = await apiClient.get('/auditing/export/csv', { params, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `audit-logs-${params.startDate}-${params.endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useAuditLogs = (filters: Partial<AuditQuery> = {}) => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: auditKeys.log(filters),
    queryFn: () => getAuditLogs(filters),
    enabled: user?.role === 'ADMIN',
  });
};

export const useAuditSummary = (params: Pick<AuditQuery, 'startDate' | 'endDate'>) => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: auditKeys.summary(params),
    queryFn: () => getAuditSummary(params),
    enabled: user?.role === 'ADMIN' && !!params.startDate && !!params.endDate,
  });
};

export const useAuditAnalytics = (type: 'trends' | 'top-users' | 'top-actions', params: any) => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: auditKeys.analytic(type, params),
    queryFn: () => getAnalytics(type, params),
    enabled: user?.role === 'ADMIN',
  });
};

export const useExportAuditCsv = () => {
  return useMutation({
    mutationFn: exportCsv,
  });
};