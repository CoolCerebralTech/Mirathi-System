/**
 * OFFICIAL EVENT CATALOG for Shamba Sure Platform
 *
 * Every event that can be published in the system MUST be defined here.
 * This serves as the single source of truth for event contracts.
 *
 * Naming Convention: {service}.{entity}.{action}
 */

export enum ShambaEvents {
  // =========================================================================
  // ACCOUNTS SERVICE EVENTS
  // =========================================================================
  // Lifecycle
  ACCOUNTS_USER_REGISTERED = 'accounts.user.registered', // UserRegisteredEvent
  ACCOUNTS_USER_ACTIVATED = 'accounts.user.activated', // UserActivatedEvent
  ACCOUNTS_ONBOARDING_COMPLETED = 'accounts.onboarding.completed', // UserOnboardingCompletedEvent
  ACCOUNTS_USER_SUSPENDED = 'accounts.user.suspended', // UserSuspendedEvent
  ACCOUNTS_USER_RESTORED = 'accounts.user.restored', // UserRestoredEvent
  ACCOUNTS_USER_DELETED = 'accounts.user.deleted', // UserDeletedEvent
  // Security & Access
  ACCOUNTS_ROLE_CHANGED = 'accounts.role.changed', // RoleChangedEvent
  ACCOUNTS_IDENTITY_LINKED = 'accounts.identity.linked', // IdentityLinkedEvent
  ACCOUNTS_PHONE_VERIFIED = 'accounts.phone.verified', // PhoneVerifiedEvent
  // User Data
  ACCOUNTS_PROFILE_UPDATED = 'accounts.profile.updated', // ProfileUpdatedEvent
  ACCOUNTS_SETTINGS_UPDATED = 'accounts.settings.updated', // SettingsUpdatedEvent

  // =========================================================================
  // SUCCESSION SERVICE EVENTS
  // =========================================================================
  SUCCESSION_WILL_CREATED = 'succession.will.created',
  SUCCESSION_WILL_UPDATED = 'succession.will.updated',
  SUCCESSION_WILL_DELETED = 'succession.will.deleted',
  SUCCESSION_HEIR_ASSIGNED = 'succession.heir.assigned',
  SUCCESSION_HEIR_REMOVED = 'succession.heir.removed',
  SUCCESSION_ESTATE_UPDATED = 'succession.estate.updated',
  SUCCESSION_ASSET_ADDED = 'succession.asset.added',
  SUCCESSION_ASSET_REMOVED = 'succession.asset.removed',

  // =========================================================================
  // DOCUMENTS SERVICE EVENTS
  // =========================================================================
  DOCUMENTS_DOCUMENT_UPLOADED = 'documents.document.uploaded',
  DOCUMENTS_DOCUMENT_VERIFIED = 'documents.document.verified',
  DOCUMENTS_DOCUMENT_REJECTED = 'documents.document.rejected',
  DOCUMENTS_DOCUMENT_DELETED = 'documents.document.deleted',
}

/**
 * Utility to extract event categories for queue binding
 */
export class EventRouting {
  static getAccountEventsPattern(): string {
    return 'accounts.#';
  }

  static getSuccessionEventsPattern(): string {
    return 'succession.#';
  }

  static getDocumentEventsPattern(): string {
    return 'documents.#';
  }

  static getNotificationEventsPattern(): string {
    return 'notifications.#';
  }

  static getAllEventsPattern(): string {
    return '#';
  }
}
