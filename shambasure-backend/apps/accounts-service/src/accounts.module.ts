import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

// Presentation Layer (Controllers)
import {
  AuthController,
  UserController,
  AdminController,
  HttpExceptionFilter,
} from './1_presentation';

// Application Layer (Services & Mappers)
import { AuthService, UserService, UserMapper, ProfileMapper, TokenMapper } from './2_application';

// Infrastructure Layer (Repositories)
import {
  UserRepository,
  ProfileRepository,
  TokenRepository,
} from './4_infrastructure/persistence/repositories';

/**
 * AccountsModule - Root module for the Accounts microservice
 *
 * Architecture: Clean Architecture / Hexagonal Architecture
 *
 * Layers:
 * - 1_presentation: Controllers, Filters (HTTP Layer)
 * - 2_application: Services, Mappers, DTOs (Use Cases)
 * - 3_domain: Models, Value Objects, Events (Business Logic)
 * - 4_infrastructure: Repositories, External Services (Technical Details)
 *
 * Domain: Identity & User Management
 *
 * Responsibilities:
 * - User registration and authentication
 * - JWT token management (access + refresh)
 * - Email verification
 * - Password management (change, reset, forgot)
 * - User profile management
 * - Phone verification (optional)
 * - Role-based access control (RBAC)
 * - Admin user management operations
 *
 * Events Published:
 * - user.created              - New user registered
 * - user.updated              - User information changed
 * - email.verified            - Email verified successfully
 * - phone.verified            - Phone verified successfully
 * - user.role_changed         - User role modified by admin
 * - password.reset_requested  - Password reset initiated
 * - user.locked               - Account locked
 *
 * Data Owned:
 * - User                 - Core user identity
 * - UserProfile          - Extended user information
 * - RefreshToken         - Active refresh tokens
 * - PasswordResetToken   - Password reset tokens
 * - EmailVerificationToken - Email verification tokens
 * - RoleChange           - Role change audit trail
 */
@Module({
  imports: [
    // ============================================================================
    // CORE INFRASTRUCTURE (Shared Libraries)
    // ============================================================================

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    DatabaseModule.forRoot(),

    AuthModule.forRoot(),

    MessagingModule.register({
      name: 'ACCOUNTS_SERVICE',
      queue: 'accounts.events',
    }),

    ObservabilityModule.register({
      serviceName: 'accounts-service',
      version: '2.0.0',
    }),
  ],

  // ============================================================================
  // PRESENTATION LAYER (HTTP)
  // ============================================================================

  controllers: [
    AuthController, // /auth/* - Authentication endpoints
    UserController, // /users/me/* - User self-service
    AdminController, // /admin/users/* - Admin management
  ],

  // ============================================================================
  // APPLICATION + INFRASTRUCTURE LAYERS
  // ============================================================================

  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Application Services (Use Cases)
    AuthService,
    UserService,

    // Mappers (Domain ↔ DTO)
    UserMapper,
    ProfileMapper,
    TokenMapper,

    // Infrastructure Repositories (Data Access)
    UserRepository,
    ProfileRepository,
    TokenRepository,
  ],

  // ============================================================================
  // EXPORTS (For other modules if needed)
  // ============================================================================

  exports: [AuthService, UserService, UserRepository, ProfileRepository, TokenRepository],
})
export class AccountsModule {}
