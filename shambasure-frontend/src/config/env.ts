import { z } from 'zod';

/**
 * Environment variable schema with Zod validation
 * Validates at app startup - fails fast if misconfigured
 */
const envSchema = z.object({
  // API Configuration
  VITE_API_BASE_URL: z.string().url().default('http://localhost:3001'),
  VITE_API_TIMEOUT: z.coerce.number().default(30000),
  
  // Feature Flags
  VITE_ENABLE_OFFLINE_MODE: z.coerce.boolean().default(true),
  VITE_ENABLE_DEBUG_LOGS: z.coerce.boolean().default(false),
  
  // App Metadata
  VITE_APP_NAME: z.string().default('Shamba Sure'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
});

/**
 * Validated environment variables
 * Type-safe access throughout the app
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * @throws {ZodError} if validation fails
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(import.meta.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Failed to validate environment variables');
  }
  
  return parsed.data;
}

/**
 * Validated environment configuration
 * Use this throughout the app instead of import.meta.env
 */
export const env = validateEnv();

/**
 * Type-safe environment variable access
 * Prevents typos and provides autocomplete
 */
export const config = {
  api: {
    baseUrl: env.VITE_API_BASE_URL,
    timeout: env.VITE_API_TIMEOUT,
  },
  features: {
    offlineMode: env.VITE_ENABLE_OFFLINE_MODE,
    debugLogs: env.VITE_ENABLE_DEBUG_LOGS,
  },
  app: {
    name: env.VITE_APP_NAME,
    version: env.VITE_APP_VERSION,
  },
} as const;