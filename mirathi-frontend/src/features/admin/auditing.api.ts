// FILE: src/features/admin/auditing.api.ts

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import {
  type AuditLog,
  AuditLogSchema,
  type AuditQuery,
  type Paginated,
  createPaginatedResponseSchema,
} from '../../types';
import { z } from 'zod';
import { toast } from 'sonner';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API ENDPOINTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ApiEndpoints = {
  LOGS: '/auditing/logs',
  SUMMARY: '/auditing/summary',
  ANALYTICS: (type: string) => `/auditing/analytics/${type}`,
  EXPORT_CSV: '/auditing/export/csv',
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// QUERY KEY FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const auditKeys = {
  all: ['auditing'] as const,
  logs: () => [...auditKeys.all, 'logs'] as const,
  logList: (filters: AuditQuery) => [...auditKeys.logs(), filters] as const,
  summaries: () => [...auditKeys.all, 'summaries'] as const,
  summary: (params: Pick<AuditQuery, 'startDate' | 'endDate'>) =>
    [...auditKeys.summaries(), params] as const,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SCHEMAS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const AuditSummarySchema = z.object({
  totalEvents: z.number(),
  userLogins: z.number(),
  assetCreations: z.number(),
  documentUploads: z.number(),
});
type AuditSummary = z.infer<typeof AuditSummarySchema>;

const AuditAnalyticsSchema = z.object({
  // Define a flexible schema that can accommodate different analytics reports
  title: z.string(),
  data: z.record(z.string(), z.any()), // e.g., [{ date: '2023-01-01', count: 10 }]
});
type AuditAnalytics = z.infer<typeof AuditAnalyticsSchema>;

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const getAuditLogs = async (
  params: AuditQuery,
): Promise<Paginated<AuditLog>> => {
  const { data } = await apiClient.get(ApiEndpoints.LOGS, { params });
  return createPaginatedResponseSchema(AuditLogSchema).parse(data);
};

const getAuditSummary = async (
  params: Pick<AuditQuery, 'startDate' | 'endDate'>,
): Promise<AuditSummary> => {
  const { data } = await apiClient.get(ApiEndpoints.SUMMARY, { params });
  return AuditSummarySchema.parse(data);
};

const getAnalytics = async (
  type: 'trends' | 'top-users',
  params: Pick<AuditQuery, 'startDate' | 'endDate'>,
): Promise<AuditAnalytics> => {
  const { data } = await apiClient.get(ApiEndpoints.ANALYTICS(type), {
    params,
  });
  return AuditAnalyticsSchema.parse(data);
};

const exportCsv = async (
  params: Pick<AuditQuery, 'startDate' | 'endDate'>,
): Promise<void> => {
  const response = await apiClient.get(ApiEndpoints.EXPORT_CSV, {
    params,
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const formattedStartDate = params.startDate?.toISOString().split('T')[0];
  const formattedEndDate = params.endDate?.toISOString().split('T')[0];
  link.setAttribute(
    'download',
    `audit-logs_${formattedStartDate}_to_${formattedEndDate}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REACT QUERY HOOKS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'ADMIN');

export const useAuditLogs = (filters: AuditQuery = {}) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: auditKeys.logList(filters),
    queryFn: () => getAuditLogs(filters),
    enabled: isAdmin,
  });
};

export const useAuditSummary = (
  params: Pick<AuditQuery, 'startDate' | 'endDate'>,
) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: auditKeys.summary(params),
    queryFn: () => getAuditSummary(params),
    enabled: isAdmin && !!params.startDate && !!params.endDate,
  });
};

export const useAuditAnalytics = (
  type: 'trends' | 'top-users',
  params: Pick<AuditQuery, 'startDate' | 'endDate'>,
) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: ['audit-analytics', type, params], // Simpler key for analytics
    queryFn: () => getAnalytics(type, params),
    enabled: isAdmin && !!params.startDate && !!params.endDate,
  });
};

export const useExportAuditCsv = () => {
  return useMutation({
    mutationFn: exportCsv,
    onSuccess: () => {
       toast.success('Your download has started.');
    },
    onError: (error) => {
      toast.error(`Failed to export audit logs: ${extractErrorMessage(error)}`);
    },
  });
};