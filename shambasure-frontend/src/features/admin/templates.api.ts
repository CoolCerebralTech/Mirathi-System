// FILE: src/features/admin/templates.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  NotificationTemplate,
  TemplateQuery,
  PaginatedResponse,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (filters: TemplateQuery) => [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getTemplates = async (params: TemplateQuery): Promise<PaginatedResponse<NotificationTemplate>> => {
  const response = await apiClient.get('/admin/templates', { params });
  return response.data;
};

const getTemplateById = async (templateId: string): Promise<NotificationTemplate> => {
  const response = await apiClient.get(`/admin/templates/${templateId}`);
  return response.data;
};

const createTemplate = async (data: CreateTemplateInput): Promise<NotificationTemplate> => {
  const response = await apiClient.post('/admin/templates', data);
  return response.data;
};

const updateTemplate = async (params: {
  templateId: string;
  data: UpdateTemplateInput;
}): Promise<NotificationTemplate> => {
  const response = await apiClient.patch(`/admin/templates/${params.templateId}`, params.data);
  return response.data;
};

const deleteTemplate = async (templateId: string): Promise<void> => {
  await apiClient.delete(`/admin/templates/${templateId}`);
};

const testTemplate = async (params: {
  templateId: string;
  recipientEmail: string;
  variables?: Record<string, string>;
}): Promise<{ message: string }> => {
  const response = await apiClient.post(`/admin/templates/${params.templateId}/test`, {
    recipientEmail: params.recipientEmail,
    variables: params.variables,
  });
  return response.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of notification templates (Admin only)
 * 
 * @example
 * const { data: templatesPage, isLoading } = useTemplates({ 
 *   page: 1, 
 *   channel: 'EMAIL' 
 * });
 */
export const useTemplates = (params: TemplateQuery = {}) => {
  const status = useAuthStore((state) => state.status);
  const userRole = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => getTemplates(params),
    enabled: status === 'authenticated' && userRole === 'ADMIN',
    staleTime: 5 * 60 * 1000, // 5 minutes - templates don't change often
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch a single template by ID (Admin only)
 * 
 * @example
 * const { data: template, isLoading } = useTemplate(templateId);
 */
export const useTemplate = (templateId: string) => {
  const status = useAuthStore((state) => state.status);
  const userRole = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: templateKeys.detail(templateId),
    queryFn: () => getTemplateById(templateId),
    enabled: status === 'authenticated' && userRole === 'ADMIN' && !!templateId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new notification template (Admin only)
 * 
 * @example
 * const createMutation = useCreateTemplate();
 * createMutation.mutate({ 
 *   name: 'Welcome Email',
 *   channel: 'EMAIL',
 *   subject: 'Welcome to Shamba Sure',
 *   body: 'Hello {{firstName}}, welcome!' 
 * });
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
    onError: (error) => {
      console.error('Create template failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to update an existing template (Admin only)
 * 
 * @example
 * const updateMutation = useUpdateTemplate();
 * updateMutation.mutate({ 
 *   templateId: '...', 
 *   data: { subject: 'Updated Subject' } 
 * });
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
    onError: (error) => {
      console.error('Update template failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to delete a template (Admin only)
 * 
 * @example
 * const deleteMutation = useDeleteTemplate();
 * deleteMutation.mutate(templateId);
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_data, templateId) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.removeQueries({ queryKey: templateKeys.detail(templateId) });
    },
    onError: (error) => {
      console.error('Delete template failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to test a template by sending it to a test email (Admin only)
 * 
 * @example
 * const testMutation = useTestTemplate();
 * testMutation.mutate({ 
 *   templateId: '...', 
 *   recipientEmail: 'test@example.com',
 *   variables: { firstName: 'John' } 
 * });
 */
export const useTestTemplate = () => {
  return useMutation({
    mutationFn: testTemplate,
    onError: (error) => {
      console.error('Test template failed:', extractErrorMessage(error));
    },
  });
};