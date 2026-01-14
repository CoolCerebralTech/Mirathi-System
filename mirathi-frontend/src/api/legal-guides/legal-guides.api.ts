// api/legal-guides.api.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

import {
  type LegalGuide,
  type GetLegalGuidesQuery,
} from '@/types/legal-guide.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/api/succession/legal-guides';

export const legalGuideKeys = {
  all: ['legal-guides'] as const,
  list: (params: GetLegalGuidesQuery) => [...legalGuideKeys.all, params] as const,
  detail: (slug: string) => [...legalGuideKeys.all, slug] as const,
  categories: ['legal-guides', 'categories'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getLegalGuides = async (params: GetLegalGuidesQuery): Promise<LegalGuide[]> => {
  const res = await apiClient.get<LegalGuide[]>(BASE_URL, { params });
  return res.data;
};

const getLegalGuide = async (slug: string): Promise<LegalGuide> => {
  const res = await apiClient.get<LegalGuide>(`${BASE_URL}/${slug}`);
  return res.data;
};

const getCategories = async (): Promise<string[]> => {
  const res = await apiClient.get<string[]>(`${BASE_URL}/meta/categories`);
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useLegalGuides = (params: GetLegalGuidesQuery = {}) => {
  return useQuery({
    queryKey: legalGuideKeys.list(params),
    queryFn: () => getLegalGuides(params),
  });
};

export const useLegalGuide = (slug: string) => {
  return useQuery({
    queryKey: legalGuideKeys.detail(slug),
    queryFn: () => getLegalGuide(slug),
    enabled: !!slug,
  });
};

export const useGuideCategories = () => {
  return useQuery({
    queryKey: legalGuideKeys.categories,
    queryFn: getCategories,
  });
};