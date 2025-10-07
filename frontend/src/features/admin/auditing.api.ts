// FILE: src/features/admin/auditing.api.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  AuditLog,
  AuditLogQuery,
  PaginatedResponse,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const auditingKeys = {
  all: ['auditing'] as const,
  logs: () => [...auditingKeys.all, 'logs'] as const,
  logLists: () => [...auditingKeys.logs(), 'list'] as const,
  logList: (filters: AuditLogQuery) => [...auditingKeys.logLists(), filters] as const,
  logDetails: () => [...auditingKeys.logs(), 'detail'] as const,
  logDetail: (id: string) => [...auditingKeys.logDetails(), id] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getAuditLogs = async (params: AuditLogQuery): Promise<PaginatedResponse<AuditLog>> => {
  const response = await apiClient.get('/auditing/logs', { params });
  return response.data;
};

const getAuditLogById = async (logId: string): Promise<AuditLog> => {
  const response = await apiClient.get(`/auditing/logs/${logId}`);
  return response.data;
};

const exportAuditLogsCsv = async (params: {
  startDate?: string;
  endDate?: string;
  action?: string;
  actorId?: string;
}): Promise<{ blob: Blob; filename: string }> => {
  const response = await apiClient.get('/auditing/export/csv', {
    params,
    responseType: 'blob',
  });

  // Extract filename from Content-Disposition header
  const contentDisposition = response.headers['content-disposition'];
  let filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch?.[1]) {
      filename = filenameMatch[1];
    }
  }

  return {
    blob: new Blob([response.data], { type: 'text/csv' }),
    filename,
  };
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch paginated and filtered audit logs (Admin only)
 * Supports filtering by action, actor, date range
 * 
 * @example
 * const { data: logsPage, isLoading } = useAuditLogs({ 
 *   page: 1, 
 *   limit: 50,
 *   action: 'WILL_CREATED',
 *   startDate: '2024-01-01T00:00:00Z' 
 * });
 */
export const useAuditLogs = (params: AuditLogQuery = {}) => {
  const status = useAuthStore((state) => state.status);
  const userRole = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: auditingKeys.logList(params),
    queryFn: () => getAuditLogs(params),
    enabled: status === 'authenticated' && userRole === 'ADMIN',
    staleTime: 1 * 60 * 1000, // 1 minute - audit logs should be relatively fresh
    keepPreviousData: true, // Smooth pagination
  });
};

/**
 * Hook to fetch a single audit log by ID (Admin only)
 * 
 * @example
 * const { data: log, isLoading } = useAuditLog(logId);
 */
export const useAuditLog = (logId: string) => {
  const status = useAuthStore((state) => state.status);
  const userRole = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: auditingKeys.logDetail(logId),
    queryFn: () => getAuditLogById(logId),
    enabled: status === 'authenticated' && userRole === 'ADMIN' && !!logId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to export audit logs as CSV (Admin only)
 * Automatically triggers download on success
 * 
 * @example
 * const exportMutation = useExportAuditLogs();
 * exportMutation.mutate({ 
 *   startDate: '2024-01-01T00:00:00Z',
 *   endDate: '2024-12-31T23:59:59Z',
 *   action: 'WILL_CREATED' 
 * });
 */
export const useExportAuditLogs = () => {
  return useMutation({
    mutationFn: exportAuditLogsCsv,
    onSuccess: ({ blob, filename }) => {
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error('Export audit logs failed:', extractErrorMessage(error));
    },
  });
};