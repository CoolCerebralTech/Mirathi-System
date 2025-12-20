import { Prisma } from '@prisma/client';

// ============================================================================
// PRISMA DEFAULTS RE-EXPORT
// ============================================================================
// Re-export all generated enums, models, and utility types from the Prisma client.
// This provides a single, consistent import path for all other services.
// Example usage:
//   import { UserRole, PrismaService } from '@shamba/database';
// ============================================================================
export * from '@prisma/client';

// ============================================================================
// GENERATED PAYLOAD TYPES FOR BUSINESS LOGIC
// ============================================================================
// These types are generated directly from our schema using Prisma.*GetPayload.
// They are guaranteed to be in sync with the database schema at all times.
// This is the STRONGLY RECOMMENDED way to define types for related data.
// ----------------------------------------------------------------------------

// --- ACCOUNTS SERVICE ---
const userWithProfile = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: { profile: true },
});
export type UserWithProfile = Prisma.UserGetPayload<typeof userWithProfile>;

// --- DOCUMENTS SERVICE ---
const documentWithVersions = Prisma.validator<Prisma.DocumentDefaultArgs>()({
  include: {
    versions: true,
  },
});
export type DocumentWithVersions = Prisma.DocumentGetPayload<typeof documentWithVersions>;

// --- NOTIFICATIONS SERVICE ---
const notificationWithTemplate = Prisma.validator<Prisma.NotificationDefaultArgs>()({
  include: {
    template: true,
    recipient: true,
  },
});
export type NotificationWithTemplate = Prisma.NotificationGetPayload<
  typeof notificationWithTemplate
>;

// --- AUDITING SERVICE ---
const auditLogWithActor = Prisma.validator<Prisma.AuditLogDefaultArgs>()({
  include: {
    actor: true,
  },
});
export type AuditLogWithActor = Prisma.AuditLogGetPayload<typeof auditLogWithActor>;

// ============================================================================
// GENERIC UTILITY TYPES
// ============================================================================

// --- Pagination ---
// Provides a consistent structure for paginated responses across services.
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// --- Database Transactions ---
// Provides a type for the Prisma transaction client, ensuring services
// can perform multi-step operations safely.
export type PrismaTransaction = Prisma.TransactionClient;

// --- Common ID type ---
// Useful for DTOs and service methods that accept either a string ID or UUID.
export type EntityId = string;

// --- Timestamped Entity ---
// A base type for entities that always include createdAt/updatedAt.
export interface TimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
}
