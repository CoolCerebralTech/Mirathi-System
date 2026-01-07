// Base event class
export * from './domain-event.base';

// User lifecycle events
export * from './user-created.event';
export * from './user-updated.event';
export * from './user-deleted.event';
export * from './user-deactivated.event';
export * from './user-reactivated.event';

// Authentication & session events
export * from './user-logged-in.event';
export * from './user-logged-out.event';
export * from './login-failed.event';
export * from './session-revoked.event';
export * from './user-locked.event';
export * from './user-unlocked.event';

// Email-related events;
export * from './email-change-requested.event';
export * from './email-changed.event';

// Phone-related events
export * from './phone-number-updated.event';

// Password-related events
export * from './password-reset-requested.event';
export * from './password-reset.event';
export * from './password-changed.event';

// Role & profile events
export * from './role-changed.event';
export * from './profile-updated.event';

// Security events
export * from './suspicious-activity-detected.event';

export * from './users-bulk-updated.event';
