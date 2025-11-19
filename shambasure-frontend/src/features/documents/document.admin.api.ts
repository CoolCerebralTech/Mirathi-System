import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  VerifyDocumentResponseSchema,
  BulkOperationResponseSchema,
  DashboardAnalyticsResponseSchema,
  DocumentVerificationHistoryResponseSchema,
  VerifierPerformanceResponseSchema,
  VerificationAttemptSchema,
  PaginatedDocumentsResponseSchema,
  DocumentAnalyticsResponseSchema,
  StorageAnalyticsResponseSchema,
  VerificationMetricsResponseSchema,
  UploadAnalyticsResponseSchema,
  
  type VerifyDocumentInput,
  type VerifyDocumentResponse,
  type BulkOperationInput,
  type BulkOperationResponse,
  type DashboardAnalytics,
  type DocumentVerificationHistory,
  type VerifierPerformance,
  type VerificationAttempt,
  type PaginatedDocumentsResponse,
  type DocumentAnalytics,
  type StorageAnalytics,
  type VerificationMetrics,
  type UploadAnalytics,
} from '../../types/document.types';
import { documentKeys } from './document.api';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ENDPOINTS = {
  VERIFY: (id: string) => `/documents/${id}/verification`,
  VERIFY_HISTORY: (id: string) => `/documents/${id}/verification/history`,
  VERIFY_BULK: '/documents/verification/bulk',
  REVERIFY: (id: string) => `/documents/${id}/verification/reverify`,
  VERIFICATION_ATTEMPTS: '/documents/verification/attempts',
  VERIFICATION_ATTEMPT: (attemptId: string) => `/documents/verification/attempts/${attemptId}`,
  VERIFICATION_LATEST: (id: string) => `/documents/${id}/verification/latest`,
  VERIFICATION_PERFORMANCE: '/documents/verification/performance',
  VERIFICATION_METRICS: '/documents/verification/metrics',
  VERIFICATION_COMPLIANCE: '/documents/verification/compliance',
  
  BULK_OPERATIONS: '/documents/bulk',
  PENDING_VERIFICATION: '/documents/pending-verification',
  
  DASHBOARD_ANALYTICS: '/statistics/dashboard',
  DASHBOARD_SUMMARY: '/statistics/summary',
  DOCUMENT_ANALYTICS: '/statistics/documents',
  STORAGE_ANALYTICS: '/statistics/storage',
  VERIFICATION_STATS: '/statistics/verification',
  UPLOAD_ANALYTICS: '/statistics/uploads',
  SYSTEM_HEALTH: '/statistics/system-health',
  DOCUMENT_TRENDS: '/statistics/trends',
  STORAGE_BY_CATEGORY: '/statistics/storage/category-usage',
  VERIFIER_PERFORMANCE: '/statistics/verification/performance',
  COMPLIANCE_ANALYTICS: '/statistics/compliance',
} as const;

const MUTATION_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const documentAdminKeys = {
  all: ['documents-admin'] as const,
  
  verification: () => [...documentAdminKeys.all, 'verification'] as const,
  verificationHistory: (id: string) => [...documentAdminKeys.verification(), 'history', id] as const,
  verificationAttempts: (filters: object) => [...documentAdminKeys.verification(), 'attempts', filters] as const,
  verificationPerformance: (filters: object) => [...documentAdminKeys.verification(), 'performance', filters] as const,
  verificationMetrics: (filters: object) => [...documentAdminKeys.verification(), 'metrics', filters] as const,
  verificationCompliance: (filters: object) => [...documentAdminKeys.verification(), 'compliance', filters] as const,
  pendingVerification: (page: number, limit: number) => [...documentAdminKeys.all, 'pending', page, limit] as const,
  
  analytics: () => [...documentAdminKeys.all, 'analytics'] as const,
  dashboardAnalytics: (filters: object) => [...documentAdminKeys.analytics(), 'dashboard', filters] as const,
  dashboardSummary: () => [...documentAdminKeys.analytics(), 'summary'] as const,
  documentAnalytics: (filters: object) => [...documentAdminKeys.analytics(), 'documents', filters] as const,
  storageAnalytics: (filters: object) => [...documentAdminKeys.analytics(), 'storage', filters] as const,
  uploadAnalytics: (filters: object) => [...documentAdminKeys.analytics(), 'uploads', filters] as const,
  systemHealth: () => [...documentAdminKeys.analytics(), 'system-health'] as const,
  trends: (filters: object) => [...documentAdminKeys.analytics(), 'trends', filters] as const,
  storageByCategory: () => [...documentAdminKeys.analytics(), 'storage-category'] as const,
  complianceAnalytics: (filters: object) => [...documentAdminKeys.analytics(), 'compliance', filters] as const,
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TimeRangeParams {
  startDate?: string;
  endDate?: string;
}

interface BulkVerifyRequest {
  documentIds: string[];
  status: 'VERIFIED' | 'REJECTED';
  reason?: string;
}

interface ReverifyRequest {
  changeNote?: string;
}

interface VerificationAttemptsParams {
  verifierId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface DashboardSummary {
  totalDocuments: number;
  totalStorage: string;
  verificationRate: number;
  documentsNeedingAttention: number;
  pendingVerification: number;
  recentUploads: number;
  storageUsage: string;
}

interface SystemHealth {
  uptime: number;
  errorRates: Record<string, number>;
  performance: {
    averageResponseTime: number;
    throughput: number;
    concurrentUsers: number;
  };
  storage: {
    totalCapacity: number;
    usedCapacity: number;
    availableCapacity: number;
    usagePercentage: number;
  };
}

interface DocumentTrends {
  uploadTrend: Array<{ date: string; count: number; sizeBytes: number }>;
  verificationTrend: Array<{ date: string; verified: number; rejected: number }>;
  storageTrend: Array<{ date: string; sizeBytes: number }>;
}

interface StorageCategoryUsage {
  category: string;
  sizeBytes: number;
  percentage: number;
  documentCount: number;
}

interface VerifierPerformanceMetrics {
  verifierId: string;
  verifierName?: string;
  totalAttempts: number;
  verified: number;
  rejected: number;
  successRate: number;
  averageTime: number;
}

interface ComplianceAnalytics {
  complianceRate: number;
  auditTrail: Array<{ date: string; activity: string; count: number }>;
  policyAdherence: Record<string, number>;
  riskAreas: Array<{ area: string; riskLevel: 'high' | 'medium' | 'low'; count: number }>;
}

interface VerificationMetricsDetailed {
  totalAttempts: number;
  totalVerified: number;
  totalRejected: number;
  totalPending: number;
  averageVerificationTimeHours: number;
  byVerifier: Record<string, { verified: number; rejected: number }>;
}

interface ComplianceAudit {
  timeRange: { start: Date; end: Date };
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  averageVerificationTime: number;
  complianceRate: number;
  verifierActivity: Array<{
    verifierId: string;
    activityCount: number;
    lastActivity: Date;
  }>;
}

// ============================================================================
// API FUNCTIONS - VERIFICATION
// ============================================================================

const verifyDocument = async ({ id, data }: { id: string; data: VerifyDocumentInput }): Promise<VerifyDocumentResponse> => {
  try {
    const response = await apiClient.put<VerifyDocumentResponse>(ENDPOINTS.VERIFY(id), data);
    return VerifyDocumentResponseSchema.parse(response.data);
  } catch (error) {
    console.error('[Admin API] Verification failed:', { id, error: extractErrorMessage(error) });
    throw error;
  }
};

const bulkVerifyDocuments = async (data: BulkVerifyRequest): Promise<BulkOperationResponse> => {
  try {
    const response = await apiClient.post<BulkOperationResponse>(ENDPOINTS.VERIFY_BULK, data);
    return BulkOperationResponseSchema.parse(response.data);
  } catch (error) {
    console.error('[Admin API] Bulk verify failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const reverifyDocument = async ({ id, data }: { id: string; data: ReverifyRequest }): Promise<VerifyDocumentResponse> => {
  try {
    const response = await apiClient.post<VerifyDocumentResponse>(ENDPOINTS.REVERIFY(id), data);
    return VerifyDocumentResponseSchema.parse(response.data);
  } catch (error) {
    console.error('[Admin API] Reverify failed:', { id, error: extractErrorMessage(error) });
    throw error;
  }
};

const getVerificationHistory = async (id: string): Promise<DocumentVerificationHistory> => {
  try {
    const { data } = await apiClient.get<DocumentVerificationHistory>(ENDPOINTS.VERIFY_HISTORY(id));
    return DocumentVerificationHistoryResponseSchema.parse(data);
  } catch (error) {
    console.error('[Admin API] Get verification history failed:', { id, error: extractErrorMessage(error) });
    throw error;
  }
};

const getVerificationAttempts = async (params: VerificationAttemptsParams): Promise<VerificationAttempt[]> => {
  try {
    const { data } = await apiClient.get<VerificationAttempt[]>(ENDPOINTS.VERIFICATION_ATTEMPTS, { params });
    return z.array(VerificationAttemptSchema).parse(data);
  } catch (error) {
    console.error('[Admin API] Get verification attempts failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getVerificationAttemptById = async (attemptId: string): Promise<VerificationAttempt> => {
  try {
    const { data } = await apiClient.get<VerificationAttempt>(ENDPOINTS.VERIFICATION_ATTEMPT(attemptId));
    return VerificationAttemptSchema.parse(data);
  } catch (error) {
    console.error('[Admin API] Get verification attempt failed:', { attemptId, error: extractErrorMessage(error) });
    throw error;
  }
};

const getLatestVerificationAttempt = async (id: string): Promise<VerificationAttempt | null> => {
  try {
    const { data } = await apiClient.get<VerificationAttempt | null>(ENDPOINTS.VERIFICATION_LATEST(id));
    return data ? VerificationAttemptSchema.parse(data) : null;
  } catch (error) {
    console.error('[Admin API] Get latest attempt failed:', { id, error: extractErrorMessage(error) });
    throw error;
  }
};

const getVerifierPerformance = async (params: TimeRangeParams & { verifierId?: string }): Promise<VerifierPerformance> => {
  try {
    const { data } = await apiClient.get<VerifierPerformance>(ENDPOINTS.VERIFICATION_PERFORMANCE, { params });
    return VerifierPerformanceResponseSchema.parse(data);
  } catch (error) {
    console.error('[Admin API] Get verifier performance failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getVerificationMetrics = async (params: TimeRangeParams): Promise<VerificationMetricsDetailed> => {
  try {
    const { data } = await apiClient.get<VerificationMetricsDetailed>(ENDPOINTS.VERIFICATION_METRICS, { params });
    return data;
  } catch (error) {
    console.error('[Admin API] Get verification metrics failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getComplianceAudit = async (params: TimeRangeParams): Promise<ComplianceAudit> => {
  try {
    const { data } = await apiClient.get<ComplianceAudit>(ENDPOINTS.VERIFICATION_COMPLIANCE, { params });
    return data;
  } catch (error) {
    console.error('[Admin API] Get compliance audit failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

// ============================================================================
// API FUNCTIONS - BULK OPERATIONS
// ============================================================================

const performBulkOperation = async (data: BulkOperationInput): Promise<BulkOperationResponse> => {
  try {
    const response = await apiClient.post<BulkOperationResponse>(ENDPOINTS.BULK_OPERATIONS, data);
    return BulkOperationResponseSchema.parse(response.data);
  } catch (error) {
    console.error('[Admin API] Bulk operation failed:', { action: data.action, error: extractErrorMessage(error) });
    throw error;
  }
};

const getPendingVerification = async (page: number = 1, limit: number = 20): Promise<PaginatedDocumentsResponse> => {
  try {
    const { data } = await apiClient.get<PaginatedDocumentsResponse>(ENDPOINTS.PENDING_VERIFICATION, {
      params: { page, limit },
    });
    return PaginatedDocumentsResponseSchema.parse(data);
  } catch (error) {
    console.error('[Admin API] Get pending verification failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

// ============================================================================
// API FUNCTIONS - ANALYTICS
// ============================================================================

const getDashboardAnalytics = async (params: TimeRangeParams = {}): Promise<DashboardAnalytics> => {
  try {
    const { data } = await apiClient.get<DashboardAnalytics>(ENDPOINTS.DASHBOARD_ANALYTICS, { params });
    return DashboardAnalyticsResponseSchema.parse(data);
  } catch (error) {
    console.error('[Admin API] Get dashboard analytics failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const { data } = await apiClient.get<DashboardSummary>(ENDPOINTS.DASHBOARD_SUMMARY);
    return data;
  } catch (error) {
    console.error('[Admin API] Get dashboard summary failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getDocumentAnalytics = async (params: { userId?: string; category?: string; status?: string }): Promise<DocumentAnalytics> => {
  try {
    const { data } = await apiClient.get<DocumentAnalytics>(ENDPOINTS.DOCUMENT_ANALYTICS, { params });
    return DocumentAnalyticsResponseSchema.parse(data);
  } catch (error) {
    console.error('[Admin API] Get document analytics failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getStorageAnalytics = async (params: { category?: string } = {}): Promise<StorageAnalytics> => {
  try {
    const { data } = await apiClient.get<StorageAnalytics>(ENDPOINTS.STORAGE_ANALYTICS, { params });
    return StorageAnalyticsResponseSchema.parse(data);
  } catch (error) {
    console.error('[Admin API] Get storage analytics failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getVerificationStats = async (params: TimeRangeParams): Promise<VerificationMetrics> => {
  try {
    const { data } = await apiClient.get<VerificationMetrics>(ENDPOINTS.VERIFICATION_STATS, { params });
    return VerificationMetricsResponseSchema.parse(data);
  } catch (error) {
    console.error('[Admin API] Get verification stats failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getUploadAnalytics = async (params: TimeRangeParams): Promise<UploadAnalytics> => {
  try {
    const { data } = await apiClient.get<UploadAnalytics>(ENDPOINTS.UPLOAD_ANALYTICS, { params });
    return UploadAnalyticsResponseSchema.parse(data);
  } catch (error) {
    console.error('[Admin API] Get upload analytics failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getSystemHealth = async (): Promise<SystemHealth> => {
  try {
    const { data } = await apiClient.get<SystemHealth>(ENDPOINTS.SYSTEM_HEALTH);
    return data;
  } catch (error) {
    console.error('[Admin API] Get system health failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getDocumentTrends = async (params: TimeRangeParams): Promise<DocumentTrends> => {
  try {
    const { data } = await apiClient.get<DocumentTrends>(ENDPOINTS.DOCUMENT_TRENDS, { params });
    return data;
  } catch (error) {
    console.error('[Admin API] Get document trends failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getStorageByCategory = async (): Promise<StorageCategoryUsage[]> => {
  try {
    const { data } = await apiClient.get<StorageCategoryUsage[]>(ENDPOINTS.STORAGE_BY_CATEGORY);
    return data;
  } catch (error) {
    console.error('[Admin API] Get storage by category failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getVerifierPerformanceMetrics = async (params: TimeRangeParams): Promise<VerifierPerformanceMetrics[]> => {
  try {
    const { data } = await apiClient.get<VerifierPerformanceMetrics[]>(ENDPOINTS.VERIFIER_PERFORMANCE, { params });
    return data;
  } catch (error) {
    console.error('[Admin API] Get verifier performance metrics failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getComplianceAnalytics = async (params: TimeRangeParams): Promise<ComplianceAnalytics> => {
  try {
    const { data } = await apiClient.get<ComplianceAnalytics>(ENDPOINTS.COMPLIANCE_ANALYTICS, { params });
    return data;
  } catch (error) {
    console.error('[Admin API] Get compliance analytics failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

// ============================================================================
// REACT QUERY HOOKS - VERIFICATION
// ============================================================================

export const useVerifyDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyDocument,
    ...MUTATION_CONFIG,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentAdminKeys.verificationHistory(data.id) });
      queryClient.invalidateQueries({ queryKey: documentAdminKeys.pendingVerification(1, 20) });
      toast.success('Document verified', { description: `Status: ${data.status}` });
    },
    onError: (error) => toast.error('Verification failed', { description: extractErrorMessage(error) }),
  });
};

export const useBulkVerifyDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkVerifyDocuments,
    ...MUTATION_CONFIG,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentAdminKeys.pendingVerification(1, 20) });
      toast.success('Bulk verification complete', {
        description: `${response.successCount} verified, ${response.failedCount} failed`,
      });
    },
    onError: (error) => toast.error('Bulk verification failed', { description: extractErrorMessage(error) }),
  });
};

export const useReverifyDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reverifyDocument,
    ...MUTATION_CONFIG,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: documentAdminKeys.verificationHistory(data.id) });
      toast.success('Document reverified successfully');
    },
    onError: (error) => toast.error('Reverification failed', { description: extractErrorMessage(error) }),
  });
};

export const useVerificationHistory = (id?: string) =>
  useQuery({
    queryKey: documentAdminKeys.verificationHistory(id!),
    queryFn: () => getVerificationHistory(id!),
    enabled: !!id,
  });

export const useVerificationAttempts = (params: VerificationAttemptsParams) =>
  useQuery({
    queryKey: documentAdminKeys.verificationAttempts(params),
    queryFn: () => getVerificationAttempts(params),
  });

export const useVerificationAttemptById = (attemptId?: string) =>
  useQuery({
    queryKey: [...documentAdminKeys.verification(), 'attempt', attemptId],
    queryFn: () => getVerificationAttemptById(attemptId!),
    enabled: !!attemptId,
  });

export const useLatestVerificationAttempt = (id?: string) =>
  useQuery({
    queryKey: [...documentAdminKeys.verification(), 'latest', id],
    queryFn: () => getLatestVerificationAttempt(id!),
    enabled: !!id,
  });

export const useVerifierPerformance = (params: TimeRangeParams & { verifierId?: string }) =>
  useQuery({
    queryKey: documentAdminKeys.verificationPerformance(params),
    queryFn: () => getVerifierPerformance(params),
  });

export const useVerificationMetrics = (params: TimeRangeParams) =>
  useQuery({
    queryKey: documentAdminKeys.verificationMetrics(params),
    queryFn: () => getVerificationMetrics(params),
    enabled: !!params.startDate && !!params.endDate,
  });

export const useComplianceAudit = (params: TimeRangeParams) =>
  useQuery({
    queryKey: documentAdminKeys.verificationCompliance(params),
    queryFn: () => getComplianceAudit(params),
    enabled: !!params.startDate && !!params.endDate,
  });

// ============================================================================
// REACT QUERY HOOKS - BULK OPERATIONS
// ============================================================================

export const useBulkOperation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: performBulkOperation,
    ...MUTATION_CONFIG,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success('Bulk operation complete', {
        description: `${response.successCount} succeeded, ${response.failedCount} failed`,
      });
    },
    onError: (error) => toast.error('Bulk operation failed', { description: extractErrorMessage(error) }),
  });
};

export const usePendingVerification = (page: number = 1, limit: number = 20) =>
  useQuery({
    queryKey: documentAdminKeys.pendingVerification(page, limit),
    queryFn: () => getPendingVerification(page, limit),
  });

// ============================================================================
// REACT QUERY HOOKS - ANALYTICS
// ============================================================================

export const useDashboardAnalytics = (params: TimeRangeParams = {}) =>
  useQuery({
    queryKey: documentAdminKeys.dashboardAnalytics(params),
    queryFn: () => getDashboardAnalytics(params),
  });

export const useDashboardSummary = () =>
  useQuery({
    queryKey: documentAdminKeys.dashboardSummary(),
    queryFn: getDashboardSummary,
  });

export const useDocumentAnalytics = (params: { userId?: string; category?: string; status?: string } = {}) =>
  useQuery({
    queryKey: documentAdminKeys.documentAnalytics(params),
    queryFn: () => getDocumentAnalytics(params),
  });

export const useStorageAnalytics = (params: { category?: string } = {}) =>
  useQuery({
    queryKey: documentAdminKeys.storageAnalytics(params),
    queryFn: () => getStorageAnalytics(params),
  });

export const useVerificationStats = (params: TimeRangeParams) =>
  useQuery({
    queryKey: documentAdminKeys.analytics(),
    queryFn: () => getVerificationStats(params),
    enabled: !!params.startDate && !!params.endDate,
  });

export const useUploadAnalytics = (params: TimeRangeParams) =>
  useQuery({
    queryKey: documentAdminKeys.uploadAnalytics(params),
    queryFn: () => getUploadAnalytics(params),
    enabled: !!params.startDate && !!params.endDate,
  });

export const useSystemHealth = () =>
  useQuery({
    queryKey: documentAdminKeys.systemHealth(),
    queryFn: getSystemHealth,
    refetchInterval: 30000,
  });

export const useDocumentTrends = (params: TimeRangeParams) =>
  useQuery({
    queryKey: documentAdminKeys.trends(params),
    queryFn: () => getDocumentTrends(params),
    enabled: !!params.startDate && !!params.endDate,
  });

export const useStorageByCategory = () =>
  useQuery({
    queryKey: documentAdminKeys.storageByCategory(),
    queryFn: getStorageByCategory,
  });

export const useVerifierPerformanceMetrics = (params: TimeRangeParams) =>
  useQuery({
    queryKey: documentAdminKeys.verificationPerformance(params),
    queryFn: () => getVerifierPerformanceMetrics(params),
    enabled: !!params.startDate && !!params.endDate,
  });

export const useComplianceAnalytics = (params: TimeRangeParams) =>
  useQuery({
    queryKey: documentAdminKeys.complianceAnalytics(params),
    queryFn: () => getComplianceAnalytics(params),
    enabled: !!params.startDate && !!params.endDate,
  });