// FILE: src/types/auth.types.ts
import { z } from 'zod';
import { AuthProviderSchema } from './shared.types';
import { UserOutputSchema } from './user.types';

// ============================================================================
// INPUT SCHEMAS (Mutations)
// ============================================================================

/**
 * Input for OAuth callback mutation
 * Matches `OAuthCallbackInput`
 */
export const OAuthCallbackInputSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  redirectUri: z.string().url('Invalid redirect URI'),
  provider: AuthProviderSchema,
});

// ============================================================================
// OUTPUT SCHEMAS (Queries/Mutations)
// ============================================================================

/**
 * Response from Login/Signup
 * Matches `AuthResponseOutput`
 */
export const AuthResponseOutputSchema = z.object({
  user: UserOutputSchema,
  isNewUser: z.boolean(),
  message: z.string().optional(),
  // Note: Tokens are likely handled via HttpOnly cookies in the new architecture,
  // or they will be added here if the backend returns them explicitly in the future.
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type OAuthCallbackInput = z.infer<typeof OAuthCallbackInputSchema>;
export type AuthResponseOutput = z.infer<typeof AuthResponseOutputSchema>;