// src/application/user/handlers/index.ts

// Command Handlers
export { RegisterUserHandler } from './register-user.handler';
export { UpdateProfileHandler } from './update-profile.handler';
export { UpdatePhoneNumberHandler } from './update-phone-number.handler';
export { VerifyPhoneHandler } from './verify-phone.handler';
export { UpdateSettingsHandler } from './update-settings.handler';
export { LinkIdentityHandler } from './link-identity.handler';
export { SuspendUserHandler } from './suspend-user.handler';

// Query Handlers
export { GetUserHandler } from './get-user.handler';
export { ListSessionsHandler } from './list-sessions.handler';
export { GetAuditLogHandler } from './get-audit-log.handler';
