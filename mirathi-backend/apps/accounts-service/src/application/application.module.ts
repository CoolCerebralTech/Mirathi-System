// src/application/application.module.ts
import { Module } from '@nestjs/common';

import { AuthModule } from '@shamba/auth';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';

import { DomainModule } from '../domain/domain.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
// Command Handlers - Admin
import {
  ActivateUserHandler,
  ChangeUserRoleHandler,
  DeleteUserHandler,
  RestoreUserHandler,
  SuspendUserHandler,
  UnsuspendUserHandler,
} from './commands/handlers/admin';
// Command Handlers - Auth
import {
  CompleteOnboardingHandler,
  LinkIdentityHandler,
  RegisterUserViaOAuthHandler,
} from './commands/handlers/auth';
// Command Handlers - Profile
import { UpdatePhoneNumberHandler, UpdateProfileHandler } from './commands/handlers/profile';
// Command Handlers - Settings
import { UpdateSettingsHandler } from './commands/handlers/settings';
// Services
import { EventPublisherService } from './events/event-publisher.service';
// Query Handlers
import {
  GetCurrentUserHandler,
  GetUserByEmailHandler,
  GetUserByIdHandler,
  GetUserByPhoneHandler,
  GetUserStatisticsHandler,
  ListUsersPaginatedHandler,
  SearchUsersHandler,
} from './queries/handlers';
import { OAuthAuthService } from './services/oauth-auth.service';
import { UserAdminService } from './services/user-admin.service';
import { UserService } from './services/user.service';
// Validators
import { CountyInputValidator, PhoneNumberInputValidator, UserInputValidator } from './validators';

/**
 * Application Module
 *
 * This module wires together all application layer components:
 * - Command handlers (write operations)
 * - Query handlers (read operations)
 * - Application services (orchestration)
 * - Validators
 * - Event publishing
 */
@Module({
  imports: [
    // Shared libraries
    ConfigModule,
    DatabaseModule,
    AuthModule,
    MessagingModule.register(), // No queue for this service (it only publishes)

    // Local modules
    DomainModule,
    InfrastructureModule,
  ],
  providers: [
    // ========================================================================
    // VALIDATORS
    // ========================================================================
    UserInputValidator,
    PhoneNumberInputValidator,
    CountyInputValidator,

    // ========================================================================
    // COMMAND HANDLERS - AUTH
    // ========================================================================
    RegisterUserViaOAuthHandler,
    LinkIdentityHandler,
    CompleteOnboardingHandler,

    // ========================================================================
    // COMMAND HANDLERS - PROFILE
    // ========================================================================
    UpdateProfileHandler,
    UpdatePhoneNumberHandler,

    // ========================================================================
    // COMMAND HANDLERS - SETTINGS
    // ========================================================================
    UpdateSettingsHandler,

    // ========================================================================
    // COMMAND HANDLERS - ADMIN
    // ========================================================================
    ActivateUserHandler,
    SuspendUserHandler,
    UnsuspendUserHandler,
    ChangeUserRoleHandler,
    DeleteUserHandler,
    RestoreUserHandler,

    // ========================================================================
    // QUERY HANDLERS
    // ========================================================================
    GetUserByIdHandler,
    GetUserByEmailHandler,
    GetUserByPhoneHandler,
    GetCurrentUserHandler,
    SearchUsersHandler,
    ListUsersPaginatedHandler,
    GetUserStatisticsHandler,

    // ========================================================================
    // EVENT PUBLISHING
    // ========================================================================
    EventPublisherService,

    // ========================================================================
    // APPLICATION SERVICES
    // ========================================================================
    UserService,
    OAuthAuthService,
    UserAdminService,
  ],
  exports: [
    // Export services for use in presentation layer (controllers)
    UserService,
    OAuthAuthService,
    UserAdminService,

    // Export validators if needed by controllers
    UserInputValidator,
    PhoneNumberInputValidator,
    CountyInputValidator,
  ],
})
export class ApplicationModule {}
