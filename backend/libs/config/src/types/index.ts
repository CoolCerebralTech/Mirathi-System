// ============================================================================
// ARCHITECTURAL NOTE: Configuration Philosophy
// ============================================================================
// Our configuration is IMMUTABLE and loaded ONCE at application startup from
// environment variables. We use a flattened structure where `app.port` from a
// nested object becomes the environment variable `PORT`. This simplifies
// mapping and validation.
//
// Complex types like arrays are loaded from comma-separated strings.
// ============================================================================

export * from '../interfaces/config.interface';

/**
 * Defines the allowed runtime environments for the application.
 * This provides strong type safety for the NODE_ENV variable.
 */
export type Environment = 'development' | 'production' | 'test';