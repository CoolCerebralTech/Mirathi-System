// src/types/shared.types.ts
// ============================================================================
// Shared Type Definitions
// ============================================================================
// - Contains generic, reusable type structures that can be used across
//   different domains (e.g., users, documents, wills).
// - The PaginatedResponse is a prime example of a shared type.
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    lastPage: number;
    currentPage: number;
    perPage: number;
    prev: number | null;
    next: number | null;
  };
}