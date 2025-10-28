import { UserRole } from '@shamba/common';
import { DomainEvent } from '../events';

// ============================================================================
// EVENT PUBLISHER INTERFACE
// ============================================================================

/**
 * IEventPublisher (Port)
 * Defines the contract for publishing domain events to the message broker.
 */
export interface IEventPublisher {
  /**
   * Publishes a single domain event.
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publishes multiple domain events in a batch.
   */
  publishBatch(events: DomainEvent[]): Promise<void>;
}

// ============================================================================
// UNIT OF WORK INTERFACE
// ============================================================================

/**
 * IUnitOfWork (Port)
 * Defines the contract for managing transactions across repositories.
 */
export interface IUnitOfWork {
  /**
   * Starts a new database transaction.
   */
  start(): Promise<void>;

  /**
   * Commits the current transaction and publishes domain events.
   */
  commit(): Promise<void>;

  /**
   * Rolls back the current transaction.
   */
  rollback(): Promise<void>;

  /**
   * Executes a function within a transaction.
   */
  execute<T>(work: () => Promise<T>): Promise<T>;
}

// ============================================================================
// HASHING SERVICE INTERFACE
// ============================================================================

/**
 * IHashingService (Port)
 * Defines the contract for cryptographic operations.
 */
export interface IHashingService {
  /**
   * Hashes a plain text value using Argon2id.
   */
  hash(plainText: string): Promise<string>;

  /**
   * Compares a plain text value against a hash.
   */
  compare(plainText: string, hash: string): Promise<boolean>;

  /**
   * Generates a random token string (URL-safe).
   */
  generateToken(length?: number): string;

  /**
   * Generates a numeric OTP code.
   */
  generateOTP(length?: number): string;

  /**
   * Generates a cryptographically secure random UUID.
   */
  generateUUID(): string;
}

// ============================================================================
// TOKEN SERVICE INTERFACE
// ============================================================================

/**
 * JWT payload structure.
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}

/**
 * ITokenService (Port)
 * Defines the contract for JWT operations.
 */
export interface ITokenService {
  /**
   * Generates an access token (short-lived JWT).
   */
  generateAccessToken(payload: JWTPayload): Promise<string>;

  /**
   * Generates a refresh token (long-lived JWT).
   */
  generateRefreshToken(payload: JWTPayload): Promise<string>;

  /**
   * Verifies and decodes an access token.
   */
  verifyAccessToken(token: string): Promise<JWTPayload>;

  /**
   * Verifies and decodes a refresh token.
   */
  verifyRefreshToken(token: string): Promise<JWTPayload>;

  /**
   * Decodes a token without verification (for expired token inspection).
   */
  decodeToken(token: string): JWTPayload | null;
}

// ============================================================================
// NOTIFICATION SERVICE INTERFACE
// ============================================================================

/**
 * Email notification payload.
 */
export interface EmailNotification {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

/**
 * SMS notification payload.
 */
export interface SMSNotification {
  to: string; // E.164 format
  message: string;
  provider?: 'Safaricom' | 'Airtel' | 'Telkom';
}

/**
 * INotificationService (Port)
 * Defines the contract for sending notifications.
 */
export interface INotificationService {
  /**
   * Sends an email notification.
   */
  sendEmail(notification: EmailNotification): Promise<void>;

  /**
   * Sends an SMS notification.
   */
  sendSMS(notification: SMSNotification): Promise<void>;
}
