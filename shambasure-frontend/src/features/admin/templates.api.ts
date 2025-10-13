/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: src/features/admin/templates.api.ts (New)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type { Template, CreateTemplateInput, UpdateTemplateInput } from '../../types';

export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (filters: any) => [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

const getTemplates = async (params: any): Promise<any> => {
  const response = await apiClient.get('/templates', { params });
  return response.data;
};
const getTemplateById = async (id: string): Promise<Template> => {
  const response = await apiClient.get(`/templates/${id}`);
  return response.data;
};
const createTemplate = async (data: CreateTemplateInput): Promise<Template> => {
  const response = await apiClient.post('/templates', data);
  return response.data;
};
const updateTemplate = async ({ id, data }: { id: string, data: UpdateTemplateInput }): Promise<Template> => {
  const response = await apiClient.patch(`/templates/${id}`, data);
  return response.data;
};
const deleteTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/templates/${id}`);
};

export const useTemplates = (params: any = {}) => useQuery({ queryKey: templateKeys.list(params), queryFn: () => getTemplates(params) });
export const useTemplate = (id: string) => useQuery({ queryKey: templateKeys.detail(id), queryFn: () => getTemplateById(id), enabled: !!id });
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: createTemplate, onSuccess: () => queryClient.invalidateQueries({ queryKey: templateKeys.lists() }) });
};
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.setQueryData(templateKeys.detail(updated.id), updated);
    },
  });
};
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: deleteTemplate, onSuccess: () => queryClient.invalidateQueries({ queryKey: templateKeys.lists() }) });
};