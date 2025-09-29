import { Prisma } from '@prisma/client';

// ============================================================================
// PRISMA DEFAULTS RE-EXPORT
// ============================================================================
// Re-export all generated enums, models, and utility types from the Prisma client.
// This provides a single, consistent import path for all other services.
export * from '@prisma/client';


// ============================================================================
// GENERATED PAYLOAD TYPES FOR BUSINESS LOGIC
// ============================================================================
// These types are generated directly from our schema using Prisma.UserGetPayload.
// They are guaranteed to be in sync with the database schema at all times.
// This is the STRONGLY RECOMMENDED way to define types for related data.
// ----------------------------------------------------------------------------

// --- ACCOUNTS SERVICE ---
const userWithProfile = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: { profile: true },
});
export type UserWithProfile = Prisma.UserGetPayload<typeof userWithProfile>;


// --- SUCCESSION SERVICE ---
const willWithAssignments = Prisma.validator<Prisma.WillDefaultArgs>()({
  include: {
    beneficiaryAssignments: {
      include: {
        asset: true,
        beneficiary: true,
      },
    },
  },
});
export type WillWithAssignments = Prisma.WillGetPayload<typeof willWithAssignments>;

const assetWithAssignments = Prisma.validator<Prisma.AssetDefaultArgs>()({
  include: {
    beneficiaryAssignments: {
      include: {
        will: true,
        beneficiary: true,
      },
    },
  },
});
export type AssetWithAssignments = Prisma.AssetGetPayload<typeof assetWithAssignments>;

const familyWithMembers = Prisma.validator<Prisma.FamilyDefaultArgs>()({
  include: {
    members: {
      include: {
        user: true,
      },
    },
  },
});
export type FamilyWithMembers = Prisma.FamilyGetPayload<typeof familyWithMembers>;


// --- DOCUMENTS SERVICE ---
const documentWithVersions = Prisma.validator<Prisma.DocumentDefaultArgs>()({
  include: {
    versions: true,
  },
});
export type DocumentWithVersions = Prisma.DocumentGetPayload<typeof documentWithVersions>;


// ============================================================================
// GENERIC UTILITY TYPES
// ============================================================================

// --- Pagination ---
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