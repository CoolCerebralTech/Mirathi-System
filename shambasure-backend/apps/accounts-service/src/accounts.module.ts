import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// --- SHARED LIBRARY IMPORTS ---
import { DatabaseModule } from '@shamba/database';
import { AuthModule as SharedAuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';
import { NotificationModule } from '@shamba/notification';

// Infrastructure
// Note: PrismaService is now provided by DatabaseModule

// Repositories
import { PrismaUserRepository } from './4_infrastructure/persistence/repositories/user.repository';
import { PrismaPasswordResetTokenRepository } from './4_infrastructure/persistence/repositories/token.repository';
import { PrismaEmailVerificationTokenRepository } from './4_infrastructure/persistence/repositories/token.repository';
import { PrismaPhoneVerificationTokenRepository } from './4_infrastructure/persistence/repositories/token.repository';
import { PrismaEmailChangeTokenRepository } from './4_infrastructure/persistence/repositories/token.repository';
import { PrismaRefreshTokenRepository } from './4_infrastructure/persistence/repositories/token.repository';
import { PrismaLoginSessionRepository } from './4_infrastructure/persistence/repositories/token.repository';
import { PrismaPasswordHistoryRepository } from './4_infrastructure/persistence/repositories/token.repository';

// Infrastructure Mappers
import { UserMapper } from './4_infrastructure/persistence/mappers/user.mapper';
import { PasswordResetTokenMapper } from './4_infrastructure/persistence/mappers/token.mapper';
import { EmailVerificationTokenMapper } from './4_infrastructure/persistence/mappers/token.mapper';
import { PhoneVerificationTokenMapper } from './4_infrastructure/persistence/mappers/token.mapper';
import { EmailChangeTokenMapper } from './4_infrastructure/persistence/mappers/token.mapper';
import { RefreshTokenMapper } from './4_infrastructure/persistence/mappers/token.mapper';
import { LoginSessionMapper } from './4_infrastructure/persistence/mappers/token.mapper';
import { PasswordHistoryMapper } from './4_infrastructure/persistence/mappers/token.mapper';
import { TokenMapperFactory } from './4_infrastructure/persistence/mappers/token.mapper';

// Application Mappers
import { AuthMapper } from './2_application/mappers/auth.mapper';
import { UserMapper as ApplicationUserMapper } from './2_application/mappers/user.mapper';
import { ProfileMapper } from './2_application/mappers/profile.mapper';
import { TokenMapper } from './2_application/mappers/token.mapper';

// Services (Application Layer)
import { AuthService } from './2_application/services/auth.service';
import { UserService } from './2_application/services/user.service';
import { AdminService } from './2_application/services/admin.service';

// Controllers (Presentation Layer)
import { AuthController } from './1_presentation/controllers/auth.controller';
import { UserController } from './1_presentation/controllers/user.controller';
import { AdminController } from './1_presentation/controllers/admin.controller';

// Health
import { HealthController } from './1_presentation/health/health.controller';
import { HealthModule } from '@shamba/observability';

@Module({
  imports: [
    // Nest.js Core Modules
    CqrsModule,

    // Shared Library Modules
    DatabaseModule, // Provides PrismaService and database connectivity
    SharedAuthModule, // Shared authentication utilities, guards, strategies
    MessagingModule.register({}), // Event publishing, email, SMS, notifications
    ObservabilityModule, // Logging, metrics, tracing, monitoring
    NotificationModule,

    // Internal Modules
    HealthModule,
  ],
  controllers: [AuthController, UserController, AdminController, HealthController],
  providers: [
    // Repositories
    PrismaUserRepository,
    PrismaPasswordResetTokenRepository,
    PrismaEmailVerificationTokenRepository,
    PrismaPhoneVerificationTokenRepository,
    PrismaEmailChangeTokenRepository,
    PrismaRefreshTokenRepository,
    PrismaLoginSessionRepository,
    PrismaPasswordHistoryRepository,

    // Infrastructure Mappers (Domain ↔ Persistence)
    UserMapper, // Infrastructure user mapper
    PasswordResetTokenMapper,
    EmailVerificationTokenMapper,
    PhoneVerificationTokenMapper,
    EmailChangeTokenMapper,
    RefreshTokenMapper,
    LoginSessionMapper,
    PasswordHistoryMapper,
    TokenMapperFactory,

    // Application Mappers (Domain ↔ DTOs)
    AuthMapper,
    ApplicationUserMapper, // Application user mapper
    ProfileMapper,
    TokenMapper,

    // Services
    AuthService,
    UserService,
    AdminService,

    // Domain Interfaces (as providers for dependency injection)
    {
      provide: 'IUserRepository',
      useExisting: PrismaUserRepository,
    },
    {
      provide: 'IUserProfileRepository',
      useExisting: PrismaUserRepository,
    },
    {
      provide: 'IPasswordResetTokenRepository',
      useExisting: PrismaPasswordResetTokenRepository,
    },
    {
      provide: 'IEmailVerificationTokenRepository',
      useExisting: PrismaEmailVerificationTokenRepository,
    },
    {
      provide: 'IPhoneVerificationTokenRepository',
      useExisting: PrismaPhoneVerificationTokenRepository,
    },
    {
      provide: 'IEmailChangeTokenRepository',
      useExisting: PrismaEmailChangeTokenRepository,
    },
    {
      provide: 'IRefreshTokenRepository',
      useExisting: PrismaRefreshTokenRepository,
    },
    {
      provide: 'ILoginSessionRepository',
      useExisting: PrismaLoginSessionRepository,
    },
    {
      provide: 'IPasswordHistoryRepository',
      useExisting: PrismaPasswordHistoryRepository,
    },
  ],
})
export class AccountModule {}
