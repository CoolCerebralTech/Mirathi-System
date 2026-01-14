// api/forms.api.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';
import { toast } from 'sonner';

import {
  type ProbateFormsResponse,
  type FormStatusResponse,
  type ValidationResult,
  type ValidateFormInput,
  type KenyanFormType,
} from '@/types/forms.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/api/succession/forms';

export const formsKeys = {
  all: ['forms'] as const,
  detail: (estateId: string) => [...formsKeys.all, estateId] as const,
  status: (estateId: string) => [...formsKeys.detail(estateId), 'status'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const generateForms = async (estateId: string): Promise<ProbateFormsResponse> => {
  const res = await apiClient.post<ProbateFormsResponse>(`${BASE_URL}/${estateId}/generate`);
  return res.data;
};

const getFormStatus = async (estateId: string): Promise<FormStatusResponse> => {
  const res = await apiClient.get<FormStatusResponse>(`${BASE_URL}/${estateId}/status`);
  return res.data;
};

// Note: Download usually triggers a browser download, not returning JSON
const downloadFormUrl = (estateId: string, formType: KenyanFormType, format: 'html' | 'pdf' = 'html') => {
  return `${process.env.NEXT_PUBLIC_API_URL}${BASE_URL}/${estateId}/download?formType=${formType}&format=${format}`;
};

const validateForm = async (data: ValidateFormInput): Promise<ValidationResult> => {
  const res = await apiClient.post<ValidationResult>(`${BASE_URL}/validate`, data);
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useFormStatus = (estateId: string) => {
  return useQuery({
    queryKey: formsKeys.status(estateId),
    queryFn: () => getFormStatus(estateId),
    enabled: !!estateId,
  });
};

export const useGenerateForms = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateForms(estateId),
    onSuccess: () => {
      toast.success('Forms Generated Successfully');
      queryClient.invalidateQueries({ queryKey: formsKeys.status(estateId) });
      // If we fetch all forms list later, invalidate that too
    },
    onError: (err) => toast.error('Generation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useValidateForm = () => {
  return useMutation({
    mutationFn: validateForm,
    onSuccess: (data) => {
      if (data.isValid) {
        toast.success('Form Valid');
      } else {
        toast.warning('Form has validation errors');
      }
    },
  });
};

export { downloadFormUrl };