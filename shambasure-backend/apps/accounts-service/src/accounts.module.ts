// In apps/accounts-service/src/accounts.module.ts

import { Module, Injectable, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// --- SHARED LIBRARY IMPORTS ---
import { DatabaseModule } from '@shamba/database';
import { AuthModule as SharedAuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

// --- All of your existing imports ---
import { AuthController } from './1_presentation/controllers/auth.controller';
import { UserController } from './1_presentation/controllers/user.controller';
import { AdminController } from './1_presentation/controllers/admin.controller';
import { HealthController } from './1_presentation/health/health.controller';
import { AuthService } from './2_application/services/auth.service';
import { UserService } from './2_application/services/user.service';
import { AdminService } from './2_application/services/admin.service';

// Mappers
import { UserMapper } from './2_application/mappers/user.mapper';
import { AuthMapper } from './2_application/mappers/auth.mapper';
import { ProfileMapper } from './2_application/mappers/profile.mapper';
import { TokenMapper } from './2_application/mappers/token.mapper';

// Repositories
import {
  PrismaUserRepository,
  PrismaPasswordResetTokenRepository,
  PrismaEmailVerificationTokenRepository,
  PrismaPhoneVerificationTokenRepository,
  PrismaEmailChangeTokenRepository,
  PrismaRefreshTokenRepository,
  PrismaLoginSessionRepository,
  PrismaPasswordHistoryRepository,
} from './4_infrastructure/repositories';

// Interfaces for DI
import {
  IUserRepository,
  IUserProfileRepository,
  IPasswordResetTokenRepository,
  IEmailVerificationTokenRepository,
  IPhoneVerificationTokenRepository,
  IEmailChangeTokenRepository,
  IRefreshTokenRepository,
  ILoginSessionRepository,
  IPasswordHistoryRepository,
  INotificationService,
} from './3_domain/interfaces';

// MOCK NOTIFICATION SERVICE
@Injectable()
class MockNotificationService implements INotificationService {
  private readonly logger = new Logger(MockNotificationService.name);
  sendEmail(data: any): Promise<void> {
    this.logger.log(`[MOCK] Sending Email: ${JSON.stringify(data)}`);
    return Promise.resolve();
  }
  sendSMS(data: any): Promise<void> {
    this.logger.log(`[MOCK] Sending SMS: ${JSON.stringify(data)}`);
    return Promise.resolve();
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    SharedAuthModule,
    MessagingModule,
    ObservabilityModule,
  ],
  controllers: [AuthController, UserController, AdminController, HealthController],
  providers: [
    // Your Services
    AuthService,
    UserService,
    AdminService,

    // Your Application Mappers
    UserMapper,
    AuthMapper,
    ProfileMapper,
    TokenMapper,

    // ********************************************************************
    // THE ONLY CHANGE IS HERE. THIS IS THE SIMPLEST WAY.
    // ********************************************************************

    // We provide the concrete classes directly.
    PrismaUserRepository,
    PrismaPasswordResetTokenRepository,
    PrismaEmailVerificationTokenRepository,
    PrismaPhoneVerificationTokenRepository,
    PrismaEmailChangeTokenRepository,
    PrismaRefreshTokenRepository,
    PrismaLoginSessionRepository,
    PrismaPasswordHistoryRepository,
    MockNotificationService, // Provide the mock service

    // Then we create "aliases" so that when a service asks for an interface,
    // NestJS knows which concrete class to give it.
    { provide: IUserRepository, useExisting: PrismaUserRepository },
    { provide: IUserProfileRepository, useExisting: PrismaUserRepository },
    { provide: IPasswordResetTokenRepository, useExisting: PrismaPasswordResetTokenRepository },
    {
      provide: IEmailVerificationTokenRepository,
      useExisting: PrismaEmailVerificationTokenRepository,
    },
    {
      provide: IPhoneVerificationTokenRepository,
      useExisting: PrismaPhoneVerificationTokenRepository,
    },
    { provide: IEmailChangeTokenRepository, useExisting: PrismaEmailChangeTokenRepository },
    { provide: IRefreshTokenRepository, useExisting: PrismaRefreshTokenRepository },
    { provide: ILoginSessionRepository, useExisting: PrismaLoginSessionRepository },
    { provide: IPasswordHistoryRepository, useExisting: PrismaPasswordHistoryRepository },
    { provide: INotificationService, useExisting: MockNotificationService },
  ],
})
export class AccountsModule {}
