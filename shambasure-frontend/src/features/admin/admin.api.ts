// FILE: src/features/admin/admin.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import {
  type User,
  UserSchema,
  type UserQuery,
  type UserRole,
  type Document,
  DocumentSchema,
  type DocumentQuery,
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
  // User Management
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  UPDATE_USER_ROLE: (id: string) => `/users/${id}/role`,
  // Document Management
  ADMIN_DOCUMENTS: '/documents/admin/all',
  VERIFY_DOCUMENT: (id:string) => `/documents/${id}/verify`,
  REJECT_DOCUMENT: (id:string) => `/documents/${id}/reject`,
  // Dashboard
  DASHBOARD_STATS: '/admin/stats',
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// QUERY KEY FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const adminKeys = {
  all: ['admin'] as const,
  // User Keys
  users: {
    all: () => [...adminKeys.all, 'users'] as const,
    lists: () => [...adminKeys.users.all(), 'list'] as const,
    list: (filters: UserQuery) => [...adminKeys.users.lists(), filters] as const,
    details: () => [...adminKeys.users.all(), 'detail'] as const,
    detail: (id: string) => [...adminKeys.users.details(), id] as const,
  },
  // Document Keys
  documents: {
    all: () => [...adminKeys.all, 'documents'] as const,
    lists: () => [...adminKeys.documents.all(), 'list'] as const,
    list: (filters: DocumentQuery) =>
      [...adminKeys.documents.lists(), filters] as const,
  },
  // Dashboard Keys
  dashboard: {
    stats: () => [...adminKeys.all, 'dashboard', 'stats'] as const,
  }
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SCHEMAS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const AdminDashboardStatsSchema = z.object({
  totalUsers: z.number(),
  totalAssets: z.number(),
  pendingDocuments: z.number(),
  activeWills: z.number(),
});
type AdminDashboardStats = z.infer<typeof AdminDashboardStatsSchema>;

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

// --- User Management ---
const getUsers = async (params: UserQuery): Promise<Paginated<User>> => {
  const { data } = await apiClient.get(ApiEndpoints.USERS, { params });
  return createPaginatedResponseSchema(UserSchema).parse(data);
};

const updateUserRole = async ({ userId, role }: { userId: string; role: UserRole }): Promise<User> => {
  const { data } = await apiClient.patch(ApiEndpoints.UPDATE_USER_ROLE(userId), { role });
  return UserSchema.parse(data);
};

const deleteUser = async (userId: string): Promise<SuccessResponse> => {
  const { data } = await apiClient.delete(ApiEndpoints.USER_BY_ID(userId));
  return SuccessResponseSchema.parse(data);
};

// --- Document Management ---
const getAdminDocuments = async (params: DocumentQuery): Promise<Paginated<Document>> => {
    const { data } = await apiClient.get(ApiEndpoints.ADMIN_DOCUMENTS, { params });
    return createPaginatedResponseSchema(DocumentSchema).parse(data);
};

const verifyDocument = async (documentId: string): Promise<Document> => {
    const { data } = await apiClient.patch(ApiEndpoints.VERIFY_DOCUMENT(documentId));
    return DocumentSchema.parse(data);
};

const rejectDocument = async (documentId: string): Promise<Document> => {
    const { data } = await apiClient.patch(ApiEndpoints.REJECT_DOCUMENT(documentId));
    return DocumentSchema.parse(data);
};

// --- Dashboard ---
const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  const { data } = await apiClient.get(ApiEndpoints.DASHBOARD_STATS);
  return AdminDashboardStatsSchema.parse(data);
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REACT QUERY HOOKS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'ADMIN');

// --- User Management Hooks ---
export const useAdminUsers = (params: UserQuery = {}) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: adminKeys.users.list(params),
    queryFn: () => getUsers(params),
    enabled: isAdmin,
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.lists() });
      queryClient.setQueryData(adminKeys.users.detail(updatedUser.id), updatedUser);
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.lists() });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

// --- Document Management Hooks ---
export const useAdminDocuments = (params: DocumentQuery = {}) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: adminKeys.documents.list(params),
    queryFn: () => getAdminDocuments(params),
    enabled: isAdmin,
  });
};

const useUpdateDocumentStatus = (mutationFn: (id: string) => Promise<Document>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updatedDocument) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.documents.lists() });
      queryClient.setQueryData(['documents', 'detail', updatedDocument.id], updatedDocument);
      const action =
        mutationFn === verifyDocument ? 'verified' : 'rejected';
      toast.success(`Document ${action} successfully`);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useVerifyDocument = () => useUpdateDocumentStatus(verifyDocument);
export const useRejectDocument = () => useUpdateDocumentStatus(rejectDocument);

// --- Dashboard Hooks ---
export const useAdminDashboardStats = () => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: adminKeys.dashboard.stats(),
    queryFn: getDashboardStats,
    enabled: isAdmin,
  });
};