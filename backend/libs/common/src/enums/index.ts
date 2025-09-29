// ============================================================================
// Shamba Sure - Shared Enumerations
// ============================================================================
// This file is the single source of truth for the "controlled vocabularies"
// used across all microservices. It ensures consistency in event names,
// error codes, and other critical business logic identifiers.
// ============================================================================

// --- 1. Prisma-Generated Enums ---
// Re-export all enums generated from our database schema.
// This provides a single, consistent import path (`@shamba/common`) for these types.
export {
  UserRole,
  RelationshipType,
  WillStatus,
  AssetType,
  DocumentStatus,
  NotificationChannel,
  NotificationStatus,
} from '@shamba/database'; // Corrected to import from our own database lib

// --- 2. Messaging Event Enums ---
// Defines the contract for all events that are published to RabbitMQ.
// Using a consistent naming convention (`domain.entity.action`) is recommended.
export enum EventPattern {
  // Accounts Service Events
  USER_CREATED = 'accounts.user.created',
  USER_UPDATED = 'accounts.user.updated',
  USER_DELETED = 'accounts.user.deleted',
  PASSWORD_RESET_REQUESTED = 'accounts.password.reset_requested',

  // Succession Service Events
  WILL_CREATED = 'succession.will.created',
  WILL_ACTIVATED = 'succession.will.activated',
  ASSET_CREATED = 'succession.asset.created',
  HEIR_ASSIGNED = 'succession.heir.assigned',

  // Documents Service Events
  DOCUMENT_UPLOADED = 'documents.document.uploaded',
  DOCUMENT_VERIFIED = 'documents.document.verified',
}

// --- 3. Standardized Error Code Enum ---
// Provides a consistent set of internal error codes for logging, monitoring,
// and creating standardized API error responses.
export enum ErrorCode {
  // General (1xxx)
  VALIDATION_FAILED = 1000,
  UNKNOWN_ERROR = 1999,

  // Auth (2xxx)
  UNAUTHENTICATED = 2000,
  INVALID_CREDENTIALS = 2001,
  JWT_EXPIRED = 2002,
  JWT_INVALID = 2003,
  FORBIDDEN = 2004,

  // Resource (3xxx)
  NOT_FOUND = 3000,
  CONFLICT = 3001, // e.g., email already exists

  // Business Logic (4xxx)
  INVALID_OPERATION = 4000,
  // e.g., cannot execute a will that is in DRAFT status

  // External Services (5xxx)
  SERVICE_UNAVAILABLE = 5000,
}

// --- 4. HTTP Status Codes ---
// ARCHITECTURAL NOTE: The `HttpStatus` enum is already provided by the
// `@nestjs/common` package. To avoid redundancy and ensure we are always
// using the standard, canonical values, we will NOT redefine it here.
//
// Instead, services should import it directly from NestJS:
// `import { HttpStatus } from '@nestjs/common';`
//
// This prevents our shared library from having an unnecessary dependency on
// framework-specific details and ensures we always use the official enum.