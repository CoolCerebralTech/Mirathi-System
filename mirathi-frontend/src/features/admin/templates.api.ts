// FILE: src/features/admin/templates.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import {
  type Template,
  TemplateSchema,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  type TemplateQuery,
  type SuccessResponse,
  SuccessResponseSchema,
  type Paginated,
  createPaginatedResponseSchema,
} from '../../types';
import { toast } from 'sonner';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API ENDPOINTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ApiEndpoints = {
  TEMPLATES: '/templates',
  TEMPLATE_BY_ID: (id: string) => `/templates/${id}`,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// QUERY KEY FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (filters: TemplateQuery) => [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const getTemplates = async (
  params: TemplateQuery,
): Promise<Paginated<Template>> => {
  const { data } = await apiClient.get(ApiEndpoints.TEMPLATES, { params });
  return createPaginatedResponseSchema(TemplateSchema).parse(data);
};

const getTemplateById = async (id: string): Promise<Template> => {
  const { data } = await apiClient.get(ApiEndpoints.TEMPLATE_BY_ID(id));
  return TemplateSchema.parse(data);
};

const createTemplate = async (
  templateData: CreateTemplateInput,
): Promise<Template> => {
  const { data } = await apiClient.post(ApiEndpoints.TEMPLATES, templateData);
  return TemplateSchema.parse(data);
};

const updateTemplate = async ({
  id,
  templateData,
}: {
  id: string;
  templateData: UpdateTemplateInput;
}): Promise<Template> => {
  const { data } = await apiClient.patch(
    ApiEndpoints.TEMPLATE_BY_ID(id),
    templateData,
  );
  return TemplateSchema.parse(data);
};

const deleteTemplate = async (id: string): Promise<SuccessResponse> => {
  const { data } = await apiClient.delete(ApiEndpoints.TEMPLATE_BY_ID(id));
  return SuccessResponseSchema.parse(data);
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REACT QUERY HOOKS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'ADMIN');

export const useTemplates = (params: TemplateQuery = {}) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => getTemplates(params),
    enabled: isAdmin,
  });
};

export const useTemplate = (id?: string) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: templateKeys.detail(id!),
    queryFn: () => getTemplateById(id!),
    enabled: isAdmin && !!id,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success('Template created successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.setQueryData(
        templateKeys.detail(updatedTemplate.id),
        updatedTemplate,
      );
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success('Template deleted successfully');
    },
    onMutate: async (deletedId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: templateKeys.lists() });
      queryClient.setQueriesData<Paginated<Template>>(
        { queryKey: templateKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.filter((t) => t.id !== deletedId),
              }
            : undefined,
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.error(extractErrorMessage(error));
    },
  });
};