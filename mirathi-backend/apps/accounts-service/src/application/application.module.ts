// src/application/application.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Modules
import { DomainModule } from '../domain/domain.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import {
  ActivateUserHandler,
  ChangeUserRoleHandler,
  DeleteUserHandler,
  RestoreUserHandler,
  SuspendUserHandler,
  UnsuspendUserHandler,
} from './commands/handlers/admin';
// Command Handlers
import {
  CompleteOnboardingHandler,
  LinkIdentityHandler,
  RegisterUserViaOAuthHandler,
} from './commands/handlers/auth';
import { UpdatePhoneNumberHandler, UpdateProfileHandler } from './commands/handlers/profile';
import { UpdateSettingsHandler } from './commands/handlers/settings';
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
// Services
import { UserService } from './services/user.service';
// Validators
import { CountyInputValidator, PhoneNumberInputValidator, UserInputValidator } from './validators';

@Module({
  imports: [
    CqrsModule, // <--- CRITICAL for @CommandHandler/@QueryHandler
    DomainModule,
    InfrastructureModule, // Provides the Repository & Publisher implementations
  ],
  providers: [
    // --- Services ---
    UserService,
    OAuthAuthService,
    UserAdminService,

    // --- Validators ---
    UserInputValidator,
    PhoneNumberInputValidator,
    CountyInputValidator,

    // --- Command Handlers ---
    RegisterUserViaOAuthHandler,
    LinkIdentityHandler,
    CompleteOnboardingHandler,
    UpdateProfileHandler,
    UpdatePhoneNumberHandler,
    UpdateSettingsHandler,
    ActivateUserHandler,
    SuspendUserHandler,
    UnsuspendUserHandler,
    ChangeUserRoleHandler,
    DeleteUserHandler,
    RestoreUserHandler,

    // --- Query Handlers ---
    GetUserByIdHandler,
    GetUserByEmailHandler,
    GetUserByPhoneHandler,
    GetCurrentUserHandler,
    SearchUsersHandler,
    ListUsersPaginatedHandler,
    GetUserStatisticsHandler,
  ],
  exports: [
    // Export Services for Controllers
    UserService,
    OAuthAuthService,
    UserAdminService,
  ],
})
export class ApplicationModule {}
