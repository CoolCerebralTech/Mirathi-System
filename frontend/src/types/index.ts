// src/types/index.ts
// ============================================================================
// Barrel File for Type Definitions
// ============================================================================
// - Re-exports all types from the other files in this directory.
// - This allows other modules in the application to import any type with a
//   single, clean import statement, like:
//   import type { User, LoginRequest } from '../types';
// ============================================================================

export * from './shared.types';
export * from './user.types';
export * from './auth.types';
export * from './document.types';
export * from './succession.types';