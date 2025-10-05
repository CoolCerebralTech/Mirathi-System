// src/types/user.types.ts
// ============================================================================
// User-Related Type Definitions
// ============================================================================
// - Defines the shape of all data related to the User and UserProfile entities.
// - This includes enums, core entity shapes, and API payloads for admin actions.
// ============================================================================

import type { PaginatedResponse } from './shared.types';

// --- Enums ---
export type UserRole = 'LAND_OWNER' | 'HEIR' | 'ADMIN';

// --- Core Data Structures ---
export interface Address {
  street?: string;
  city?: string;
  postCode?: string;
  country?: string;
}

export interface NextOfKin {
  fullName: string;
  relationship: string;
  phoneNumber: string;
}

export interface UserProfile {
  bio?: string;
  phoneNumber?: string;
  address?: Address;
  nextOfKin?: NextOfKin;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName:string;
  role: UserRole;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  profile?: UserProfile;
}

// --- API Payloads ---
export type PaginatedUsersResponse = PaginatedResponse<User>;

export interface UpdateUserRoleRequest {
    role: UserRole;
}