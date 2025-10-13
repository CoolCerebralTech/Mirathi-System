// FILE: src/types/schemas/index.ts

// ============================================================================
// CENTRALIZED SCHEMA EXPORTS
// Organized by microservice domain for easy maintenance
// ============================================================================

// Common utilities and helpers
export * from './common.schemas';

// Accounts Service
export * from './auth.schemas';
export * from './user.schemas';

// Succession Service
export * from './assets.schemas';
export * from './families.schemas';
export * from './wills.schemas';
// Documents Service
export * from './documents.schemas';

// Notifications Service
export * from './notifications.schemas';
export * from './templates.schemas';

// Auditing Service
export * from './auditing.schemas';