/**
 * OFFICIAL EVENT CATALOG for Shamba Sure Platform
 * Naming Convention: {SERVICE}_{ENTITY}_{ACTION} = 'service.entity.action'
 */
export enum ShambaEvents {
  // =========================================================================
  // ACCOUNTS SERVICE EVENTS
  // =========================================================================
  ACCOUNTS_USER_CREATED = 'accounts.user.created',
  ACCOUNTS_USER_UPDATED = 'accounts.user.updated',
  ACCOUNTS_USER_DELETED = 'accounts.user.deleted',
  ACCOUNTS_PASSWORD_RESET_REQUESTED = 'accounts.password.reset.requested',
  ACCOUNTS_PASSWORD_CHANGED = 'accounts.password.changed',
  ACCOUNTS_PROFILE_UPDATED = 'accounts.profile.updated',

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
  DOCUMENTS_DOCUMENT_EXPIRED = 'documents.document.expired', // Added this

  // =========================================================================
  // NOTIFICATIONS SERVICE EVENTS
  // =========================================================================
  NOTIFICATIONS_EMAIL_SENT = 'notifications.email.sent',
  NOTIFICATIONS_SMS_SENT = 'notifications.sms.sent',
  NOTIFICATIONS_PUSH_SENT = 'notifications.push.sent',
}

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
