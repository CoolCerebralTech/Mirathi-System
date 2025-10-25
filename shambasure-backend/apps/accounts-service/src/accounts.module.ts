import { Module } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { HealthModule } from './health/health.module';

import { AuthController } from './controllers/auth.controller';
import { AdminController } from './controllers/admin.controller';

import { AccountsService } from './services/accounts.service';
import { UsersRepository } from './repositories/users.repository';

/**
 * Accounts Module - Root module for the Accounts microservice.
 *
 * Domain: Identity & User Management
 *
 * Responsibilities:
 * - User registration and authentication
 * - JWT token management (access + refresh)
 * - Password management (change, reset, forgot)
 * - User profile management
 * - Role-based access control (RBAC)
 * - Admin user management operations
 *
 * Events Published:
 * - user.created       - New user registered
 * - user.updated       - User information changed
 * - user.deleted       - User account deleted
 * - password.changed   - User changed password
 * - role.changed       - User role modified by admin
 *
 * Data Owned:
 * - User               - Core user identity
 * - UserProfile        - Extended user information
 * - RefreshToken       - Active refresh tokens
 * - PasswordResetToken - Password reset tokens
 * - RoleChange         - Role change audit trail
 */
@Module({
  imports: [
    // ============================================================================
    // CORE INFRASTRUCTURE
    // ============================================================================

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    DatabaseModule.forRoot(),

    AuthModule.forRoot(),

    // ============================================================================
    // MICROSERVICE MODULES
    // ============================================================================

    HealthModule,

    MessagingModule.register({
      name: 'ACCOUNTS_SERVICE',
      queue: 'accounts.events',
    }),

    ObservabilityModule.register({
      serviceName: 'accounts-service',
      version: '1.0.0',
    }),
  ],

  // ============================================================================
  // HTTP LAYER
  // ============================================================================

  controllers: [
    AuthController, // /auth/* - Authentication & user profile
    AdminController, // /admin/users/* - Admin user management
  ],

  // ============================================================================
  // BUSINESS LOGIC & DATA ACCESS
  // ============================================================================

  providers: [
    // Services
    AccountsService, // User & profile management

    // Repositories
    UsersRepository, // User data access layer
  ],

  // ============================================================================
  // EXPORTS
  // ============================================================================

  exports: [AccountsService, UsersRepository],
})
export class AccountsModule {}
