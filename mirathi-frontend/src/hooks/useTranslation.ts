// FILE: src/hooks/useTranslation.ts

import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook for translations with TypeScript support
 * Wraps react-i18next's useTranslation with better typing
 */
export function useTranslation(namespace?: string | string[]) {
  return useI18nTranslation(namespace);
}