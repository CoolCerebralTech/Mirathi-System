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
import { PrismaUserRepository } from './infrastructure/persistence/repositories/user.repository';
import { PrismaPasswordResetTokenRepository } from './infrastructure/persistence/repositories/token.repository';
import { PrismaEmailVerificationTokenRepository } from './infrastructure/persistence/repositories/token.repository';
import { PrismaPhoneVerificationTokenRepository } from './infrastructure/persistence/repositories/token.repository';
import { PrismaEmailChangeTokenRepository } from './infrastructure/persistence/repositories/token.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/repositories/token.repository';
import { PrismaLoginSessionRepository } from './infrastructure/persistence/repositories/token.repository';
import { PrismaPasswordHistoryRepository } from './infrastructure/persistence/repositories/token.repository';

// Infrastructure Mappers
import { UserMapper } from './infrastructure/persistence/mappers/user.mapper';
import { PasswordResetTokenMapper } from './infrastructure/persistence/mappers/token.mapper';
import { EmailVerificationTokenMapper } from './infrastructure/persistence/mappers/token.mapper';
import { PhoneVerificationTokenMapper } from './infrastructure/persistence/mappers/token.mapper';
import { EmailChangeTokenMapper } from './infrastructure/persistence/mappers/token.mapper';
import { RefreshTokenMapper } from './infrastructure/persistence/mappers/token.mapper';
import { LoginSessionMapper } from './infrastructure/persistence/mappers/token.mapper';
import { PasswordHistoryMapper } from './infrastructure/persistence/mappers/token.mapper';
import { TokenMapperFactory } from './infrastructure/persistence/mappers/token.mapper';

// Application Mappers
import { AuthMapper } from './application/mappers/auth.mapper';
import { UserMapper as ApplicationUserMapper } from './application/mappers/user.mapper';
import { ProfileMapper } from './application/mappers/profile.mapper';
import { TokenMapper } from './application/mappers/token.mapper';

// Services (Application Layer)
import { AuthService } from './application/services/auth.service';
import { UserService } from './application/services/user.service';
import { AdminService } from './application/services/admin.service';

// Controllers (Presentation Layer)
import { AuthController } from './presentation/controllers/auth.controller';
import { UserController } from './presentation/controllers/user.controller';
import { AdminController } from './presentation/controllers/admin.controller';

// Health
import { HealthController } from './presentation/health/health.controller';

@Module({
  imports: [
    // Nest.js Core Modules
    CqrsModule,

    // Shared Library Modules
    DatabaseModule, // Provides PrismaService and database connectivity
    SharedAuthModule, // Shared authentication utilities, guards, strategies
    MessagingModule.register({}), // Event publishing, email, SMS, notifications
    ObservabilityModule.register({ serviceName: 'accounts-service', version: '1.0.0' }), // Logging, metrics, tracing, monitoring
    NotificationModule,
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
