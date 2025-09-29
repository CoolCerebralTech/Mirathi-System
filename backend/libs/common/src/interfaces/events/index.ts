import { EventPattern } from '../../enums';
import { UserRole, WillStatus, DocumentStatus, NotificationChannel } from '@shamba/database';

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

export interface DocumentVerifiedData {
  documentId: string;
  uploaderId: string;
  filename: string;
  status: DocumentStatus; // Now strongly typed
}

// --- Concrete Event Interfaces ---

export type UserCreatedEvent = BaseEvent<EventPattern.USER_CREATED, UserCreatedData>;
export type PasswordResetRequestedEvent = BaseEvent<EventPattern.PASSWORD_RESET_REQUESTED, PasswordResetRequestedData>;
export type WillCreatedEvent = BaseEvent<EventPattern.WILL_CREATED, WillCreatedData>;
export type DocumentVerifiedEvent = BaseEvent<EventPattern.DOCUMENT_VERIFIED, DocumentVerifiedData>;

// --- Union type for all possible events ---
export type ShambaEvent =
  | UserCreatedEvent
  | PasswordResetRequestedEvent
  | WillCreatedEvent
  | DocumentVerifiedEvent;