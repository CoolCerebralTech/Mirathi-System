// FILE: src/types/shared.types.ts
import { z } from 'zod';

// ============================================================================
// ENUMS (Matching Prisma & GraphQL Enums)
// ============================================================================

export const UserRoleSchema = z.enum(['USER', 'VERIFIER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const AccountStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED', 'PENDING_ONBOARDING']);
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

export const AuthProviderSchema = z.enum(['GOOGLE']);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

export const LanguageSchema = z.enum(['ENGLISH', 'SWAHILI']);
export type Language = z.infer<typeof LanguageSchema>;

export const ThemeSchema = z.enum(['SYSTEM', 'LIGHT', 'DARK']);
export type Theme = z.infer<typeof ThemeSchema>;

export const KenyanCountySchema = z.enum([
  'BARINGO', 'BOMET', 'BUNGOMA', 'BUSIA', 'ELGEYO_MARAKWET', 'EMBU', 'GARISSA', 
  'HOMA_BAY', 'ISIOLO', 'KAJIADO', 'KAKAMEGA', 'KERICHO', 'KIAMBU', 'KILIFI', 
  'KIRINYAGA', 'KISII', 'KISUMU', 'KITUI', 'KWALE', 'LAIKIPIA', 'LAMU', 
  'MACHAKOS', 'MAKUENI', 'MANDERA', 'MARSABIT', 'MERU', 'MIGORI', 'MOMBASA', 
  'MURANGA', 'NAIROBI', 'NAKURU', 'NANDI', 'NAROK', 'NYAMIRA', 'NYANDARUA', 
  'NYERI', 'SAMBURU', 'SIAYA', 'TAITA_TAVETA', 'TANA_RIVER', 'THARAKA_NITHI', 
  'TRANS_NZOIA', 'TURKANA', 'UASIN_GISHU', 'VIHIGA', 'WAJIR', 'WEST_POKOT'
]);
export type KenyanCounty = z.infer<typeof KenyanCountySchema>;

// ============================================================================
// LABELS & UTILS
// ============================================================================

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: 'User',
  VERIFIER: 'Verifier',
  ADMIN: 'Administrator',
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  ARCHIVED: 'Archived',
  PENDING_ONBOARDING: 'Pending Onboarding',
};

export const COUNTY_LABELS = KenyanCountySchema.options.reduce((acc, curr) => {
  acc[curr] = curr.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return acc;
}, {} as Record<KenyanCounty, string>);