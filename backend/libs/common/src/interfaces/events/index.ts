import { EventPattern } from '../../enums';
import { UserRole, WillStatus, DocumentStatus, NotificationChannel, AssetType } from '@shamba/database';

// ============================================================================
// ARCHITECTURAL NOTE:
// These interfaces define the strict data contracts for all event-driven
// communication between microservices via RabbitMQ. They are the single
// source of truth for event payloads.
// ============================================================================

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
  profile?: {
    bio?: string | null;
    phoneNumber?: string | null;
  };
}

export interface UserDeletedData {
  userId: string;
  email: string;
}

export interface PasswordResetRequestedData {
  userId: string;
  email: string;
  firstName: string;
  resetToken: string; // The service sends the token, not just a request
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
export type PasswordResetRequestedEvent = BaseEvent<EventPattern.PASSWORD_RESET_REQUESTED, PasswordResetRequestedData>;
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
  | PasswordResetRequestedEvent
  | DocumentUploadedEvent
  | WillCreatedEvent
  | WillUpdatedEvent    
  | HeirAssignedEvent 
  | DocumentVerifiedEvent
  | DocumentDeletedEvent
  | AssetCreatedEvent
  | AssetUpdatedEvent
  | AssetDeletedEvent;
  