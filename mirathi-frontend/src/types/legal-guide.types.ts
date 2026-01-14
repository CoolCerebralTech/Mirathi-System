// types/legal-guide.types.ts
import { z } from 'zod';

// ============================================================================
// 1. ENUMS (Object Literal Pattern)
// ============================================================================

export const SuccessionRegime = {
  TESTATE: 'TESTATE',
  INTESTATE: 'INTESTATE',
  PARTIALLY_INTESTATE: 'PARTIALLY_INTESTATE',
} as const;
export type SuccessionRegime = (typeof SuccessionRegime)[keyof typeof SuccessionRegime];

export const SuccessionReligion = {
  STATUTORY: 'STATUTORY',
  ISLAMIC: 'ISLAMIC',
  HINDU: 'HINDU',
  CUSTOMARY: 'CUSTOMARY',
} as const;
export type SuccessionReligion = (typeof SuccessionReligion)[keyof typeof SuccessionReligion];

// ============================================================================
// 2. DOMAIN INTERFACES
// ============================================================================

export interface LegalGuide {
  id: string;
  category: string;
  title: string;
  slug: string;
  summary: string;
  fullContent: string;
  appliesToRegime: SuccessionRegime[];
  appliesToReligion: SuccessionReligion[];
  legalSections: string[];
  relatedFormTypes: string[]; 
  relatedTasks: string[];
  keywords: string[];
  viewCount: number;
  createdAt: string;
}

// ============================================================================
// 3. ZOD SCHEMAS
// ============================================================================

export const GetLegalGuidesQuerySchema = z.object({
  category: z.string().optional(),
  regime: z.nativeEnum(SuccessionRegime).optional(),
  religion: z.nativeEnum(SuccessionReligion).optional(),
});

export type GetLegalGuidesQuery = z.infer<typeof GetLegalGuidesQuerySchema>;