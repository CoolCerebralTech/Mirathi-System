// FILE: src/types/families.schemas.ts

import { z } from 'zod';
import { UserResponseSchema } from './user.types';

// ============================================================================
// SHARED ENUMS AND REUSABLE SCHEMAS
//
// NOTE: This model shifts from a simple "Family Group" to a more powerful
// "Relationship Graph". This is essential for building a true family tree,
// where relationships are defined between individuals, not just membership in a group.
// ============================================================================

/**
 * Defines the type of relationship of a target user relative to a source user.
 * E.g., If John (source) adds his son, Tom (target), the type is 'CHILD'.
 */
export const RelationshipTypeSchema = z.enum([
  'SPOUSE',
  'PARTNER',
  'CHILD',
  'PARENT',
  'GRANDPARENT',
  'GRANDCHILD',
  'SIBLING',
  'AUNT_UNCLE',
  'NIECE_NEPHEW',
  'COUSIN',
  'GUARDIAN',
  'DEPENDENT',
  'OTHER',
]);

/**
 * Defines the status of an invitation to join a family tree.
 */
export const InvitationStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
]);

// ============================================================================
// API RESPONSE SCHEMAS (Data shapes received from the server)
// ============================================================================

/**
 * Represents a directed relationship between two users.
 * This is the core "edge" of the family graph.
 */
export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  // The user who defined the relationship
  sourceUserId: z.string().uuid(),
  sourceUser: UserResponseSchema.optional(),
  // The user who is being related to
  targetUserId: z.string().uuid(),
  targetUser: UserResponseSchema.optional(),
  // How the target is related to the source
  type: RelationshipTypeSchema,
  createdAt: z.string().datetime().transform((val) => new Date(val)),
});

/**
 * Represents an invitation sent to someone to join the family tree.
 */
export const FamilyInvitationSchema = z.object({
  id: z.string().uuid(),
  inviterId: z.string().uuid(),
  inviter: UserResponseSchema.optional(),
  inviteeEmail: z.string().email(),
  // The proposed relationship of the invitee to the inviter
  relationshipType: RelationshipTypeSchema,
  status: InvitationStatusSchema,
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  expiresAt: z.string().datetime().transform((val) => new Date(val)),
});

/**
 * Represents the complete family tree data for a user.
 * It's composed of all relevant individuals (nodes) and the relationships (edges)
 * that connect them.
 */
export const FamilyTreeSchema = z.object({
  nodes: z.array(UserResponseSchema),
  edges: z.array(RelationshipSchema),
});

// ============================================================================
// FORM/REQUEST SCHEMAS (Payloads sent to the server)
// ============================================================================

/**
 * Schema for inviting a new member to the family tree via email.
 */
export const InviteMemberSchema = z.object({
  inviteeEmail: z.string().email('Please enter a valid email address'),
  relationshipType: RelationshipTypeSchema,
});

/**
 * Schema for creating a relationship between two users who are already on the platform.
 */
export const CreateRelationshipSchema = z.object({
  // The user you are adding to your tree
  targetUserId: z.string().uuid('A valid user must be selected'),
  // How they are related to you
  relationshipType: RelationshipTypeSchema,
});

/**
 * Schema for updating an existing relationship.
 */
export const UpdateRelationshipSchema = z.object({
  relationshipId: z.string().uuid(),
  newType: RelationshipTypeSchema,
});

/**
 * Schema for an invitee to respond to an invitation.
 */
export const RespondToInvitationSchema = z.object({
  invitationId: z.string().uuid(),
  action: z.enum(['ACCEPT', 'DECLINE']),
});

// ============================================================================
// API QUERY SCHEMAS
// ============================================================================

/**
 * Schema for querying a user's relationships.
 */
export const RelationshipQuerySchema = z.object({
  userId: z.string().uuid(), // The user whose relationships we are fetching
  type: RelationshipTypeSchema.optional(),
});

/**
 * Schema for querying a user's pending invitations.
 */
export const InvitationQuerySchema = z.object({
  status: InvitationStatusSchema.optional(),
  // Either fetch invitations sent *by* the user or sent *to* the user's email
  filterBy: z.enum(['sent', 'received']),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type FamilyInvitation = z.infer<typeof FamilyInvitationSchema>;
export type FamilyTree = z.infer<typeof FamilyTreeSchema>;

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type CreateRelationshipInput = z.infer<typeof CreateRelationshipSchema>;
export type UpdateRelationshipInput = z.infer<typeof UpdateRelationshipSchema>;
export type RespondToInvitationInput = z.infer<
  typeof RespondToInvitationSchema
>;

export type RelationshipQuery = z.infer<typeof RelationshipQuerySchema>;
export type InvitationQuery = z.infer<typeof InvitationQuerySchema>;