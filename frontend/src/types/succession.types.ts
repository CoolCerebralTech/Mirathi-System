// src/types/succession.types.ts
// ============================================================================
// Succession Service Type Definitions
// ============================================================================
// - Defines the shape of all data related to the core succession-planning
// entities: Wills, Assets, Families, and Beneficiaries.
// ============================================================================
import type { User } from './user.types';
// --- Enums ---
export type WillStatus = 'DRAFT' | 'ACTIVE' | 'REVOKED' | 'EXECUTED';
export type AssetType = 'LAND_PARCEL' | 'BANK_ACCOUNT' | 'VEHICLE' | 'PROPERTY' | 'OTHER';
export type RelationshipType = 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'OTHER';
// --- Core Data Structures ---
export interface Asset {
id: string;
name: string;
description?: string;
type: AssetType;
ownerId: string;
createdAt: string; // ISO date string
updatedAt: string; // ISO date string
}
export interface BeneficiaryAssignment {
id: string;
willId: string;
assetId: string;
beneficiaryId: string;
sharePercent?: number;
asset: Asset;
beneficiary: User;
}
export interface Will {
id: string;
title: string;
status: WillStatus;
testatorId: string;
beneficiaryAssignments: BeneficiaryAssignment[];
createdAt: string; // ISO date string
updatedAt: string; // ISO date string
}
export interface FamilyMember {
userId: string;
role: RelationshipType;
user: User;
}
export interface Family {
id: string;
name: string;
creatorId: string;
members: FamilyMember[];
createdAt: string; // ISO date string
updatedAt: string; // ISO date string
}
// --- API Payloads (REQUESTS) ---
export interface CreateAssetRequest {
name: string;
description?: string;
type: AssetType;
}
export interface UpdateAssetRequest {
name?: string;
description?: string;
type?: AssetType;
}