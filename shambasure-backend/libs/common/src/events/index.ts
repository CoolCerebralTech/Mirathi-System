import { EventPattern } from '../enums';
import { UserRole, WillStatus, DocumentStatus, AssetType } from '@shamba/database';

/**
 * The base structure for all events published within the Shamba Sure ecosystem.
 */
export interface BaseEvent<T extends EventPattern, D> {
  /** The unique type identifier for the event. */
  type: T;
  /** The ISO 8601 timestamp when the event was generated. */
  timestamp: Date;
  /** The version of this event's data schema. */
  version: '1.0';
  /** The name of the microservice that published the event (e.g., "accounts-service"). */
  source: string;
  /** A unique ID for tracing a request's flow across multiple services. */
  correlationId?: string;
  /** The actual data payload of the event. */
  data: D;
}

// --- Event Data Payloads ---

export interface UserCreatedData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UserUpdatedData {
  userId: string;
  updatedFields?: string[];
}

export interface UserDeletedData {
  userId: string;
  email: string;
}

export interface UserLoggedInData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface EmailVerificationRequestedData {
  userId: string;
  email: string;
  firstName: string;
  verificationToken: string;
  expiresAt: string; // ISO 8601 string
}

export interface EmailVerifiedData {
  userId: string;
  email: string;
}

export interface PasswordChangedData {
  userId: string;
}

export interface PasswordResetRequestedData {
  expiresAt: any;
  userId: string;
  email: string;
  firstName: string;
  resetToken: string; // The service sends the token, not just a request
}

export interface PasswordResetData {
  userId: string;
}

export interface RoleChangedData {
  userId: string;
  oldRole: UserRole;
  newRole: UserRole;
  changedBy: string; // The admin's userId
  reason?: string | null;
}

export interface UserSessionsInvalidatedData {
  userId: string;
  reason: 'PASSWORD_CHANGE' | 'ROLE_CHANGE' | 'ADMIN_ACTION'; // A reason for the invalidation
}

export interface WillCreatedData {
  willId: string;
  testatorId: string;
  title: string;
  status: WillStatus;
}

export interface WillUpdatedData {
  willId: string;
  testatorId: string;
  status: WillStatus;
}

export interface HeirAssignedData {
  willId: string;
  assetId: string;
  beneficiaryId: string;
  sharePercent: number | null;
}

export interface AssetCreatedData {
  assetId: string;
  ownerId: string;
  name: string;
  type: AssetType;
}

export interface AssetUpdatedData {
  assetId: string;
  ownerId: string;
  name: string;
}

export interface AssetDeletedData {
  assetId: string;
  ownerId: string;
}

export interface DocumentUploadedData {
  documentId: string;
  uploaderId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
}

export interface DocumentVerifiedData {
  documentId: string;
  uploaderId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
}

export interface DocumentDeletedData {
  documentId: string;
  uploaderId: string;
}

// --- Concrete Event Interfaces ---

export type UserCreatedEvent = BaseEvent<EventPattern.USER_CREATED, UserCreatedData>;
export type UserUpdatedEvent = BaseEvent<EventPattern.USER_UPDATED, UserUpdatedData>;
export type UserDeletedEvent = BaseEvent<EventPattern.USER_DELETED, UserDeletedData>;
export type UserLoggedInEvent = BaseEvent<EventPattern.USER_LOGGED_IN, UserLoggedInData>;
export type EmailVerificationRequestedEvent = BaseEvent<
  EventPattern.EMAIL_VERIFICATION_REQUESTED,
  EmailVerificationRequestedData
>;
export type EmailVerifiedEvent = BaseEvent<EventPattern.EMAIL_VERIFIED, EmailVerifiedData>;
export type PasswordChangedEvent = BaseEvent<EventPattern.PASSWORD_CHANGED, PasswordChangedData>;
export type PasswordResetEvent = BaseEvent<EventPattern.PASSWORD_RESET, PasswordResetData>;
export type RoleChangedEvent = BaseEvent<EventPattern.ROLE_CHANGED, RoleChangedData>;

export type PasswordResetRequestedEvent = BaseEvent<
  EventPattern.PASSWORD_RESET_REQUESTED,
  PasswordResetRequestedData
>;
export type UserSessionsInvalidatedEvent = BaseEvent<
  EventPattern.USER_SESSIONS_INVALIDATED,
  UserSessionsInvalidatedData
>;
export type WillCreatedEvent = BaseEvent<EventPattern.WILL_CREATED, WillCreatedData>;
export type WillUpdatedEvent = BaseEvent<EventPattern.WILL_UPDATED, WillUpdatedData>;
export type HeirAssignedEvent = BaseEvent<EventPattern.HEIR_ASSIGNED, HeirAssignedData>;
export type DocumentVerifiedEvent = BaseEvent<EventPattern.DOCUMENT_VERIFIED, DocumentVerifiedData>;
export type DocumentUploadedEvent = BaseEvent<EventPattern.DOCUMENT_UPLOADED, DocumentUploadedData>;
export type DocumentDeletedEvent = BaseEvent<EventPattern.DOCUMENT_DELETED, DocumentDeletedData>;
export type AssetCreatedEvent = BaseEvent<EventPattern.ASSET_CREATED, AssetCreatedData>;
export type AssetUpdatedEvent = BaseEvent<EventPattern.ASSET_UPDATED, AssetUpdatedData>;
export type AssetDeletedEvent = BaseEvent<EventPattern.ASSET_DELETED, AssetDeletedData>;

// --- Union type for all possible events ---
export type ShambaEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | UserLoggedInEvent
  | EmailVerificationRequestedEvent
  | EmailVerifiedEvent
  | PasswordChangedEvent
  | PasswordResetRequestedEvent
  | PasswordResetEvent
  | RoleChangedEvent
  | UserSessionsInvalidatedEvent
  | DocumentUploadedEvent
  | WillCreatedEvent
  | WillUpdatedEvent
  | HeirAssignedEvent
  | DocumentVerifiedEvent
  | DocumentDeletedEvent
  | AssetCreatedEvent
  | AssetUpdatedEvent
  | AssetDeletedEvent;
