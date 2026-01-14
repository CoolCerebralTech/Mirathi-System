// types/forms.types.ts
import { z } from 'zod';

// ============================================================================
// 1. ENUMS (Object Literal Pattern)
// ============================================================================

export const KenyanFormType = {
  PA1_PROBATE: 'PA1_PROBATE',
  PA80_INTESTATE: 'PA80_INTESTATE',
  PA5_SUMMARY: 'PA5_SUMMARY',
  PA12_AFFIDAVIT_MEANS: 'PA12_AFFIDAVIT_MEANS',
  PA38_FAMILY_CONSENT: 'PA38_FAMILY_CONSENT',
  CHIEFS_LETTER: 'CHIEFS_LETTER',
  ISLAMIC_PETITION: 'ISLAMIC_PETITION',
} as const;
export type KenyanFormType = (typeof KenyanFormType)[keyof typeof KenyanFormType];

// ============================================================================
// 2. DOMAIN INTERFACES
// ============================================================================

export interface GeneratedForm {
  formType: KenyanFormType;
  title: string;
  code: string;
  htmlPreview: string;
  purpose: string;
  instructions: string[];
  missingFields: string[];
}

export interface ProbateFormsResponse {
  previewId: string;
  isComplete: boolean;
  forms: GeneratedForm[];
  missingRequirements: string[];
  totalForms: number;
  completedForms: number;
}

export interface FormStatusResponse {
  isReady: boolean;
  requiredForms: KenyanFormType[];
  completedForms: KenyanFormType[];
  missingForms: KenyanFormType[];
  missingFields: Record<string, string[]>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// 3. ZOD SCHEMAS
// ============================================================================

export const ValidateFormSchema = z.object({
  formType: z.nativeEnum(KenyanFormType),
  // FIX: Explicitly define key type as string and value type as any
  formData: z.record(z.string(), z.any()), 
});

export type ValidateFormInput = z.infer<typeof ValidateFormSchema>;