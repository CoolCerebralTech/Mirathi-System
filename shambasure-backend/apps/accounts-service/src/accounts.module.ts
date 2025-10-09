// ============================================================================
// accounts.module.ts - Accounts Service Root Module
// ============================================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';

import { UsersService } from './services/users.service';
import { ProfileService } from './services/profile.service';
import { UsersRepository } from './repositories/users.repository';

/**
 * AccountsModule - Root module for Accounts microservice
 *
 * DOMAIN: Identity & User Management
 *
 * RESPONSIBILITIES:
 * - User registration and authentication
 * - Profile management
 * - Password reset flows
 * - User CRUD operations (admin)
 *
 * PUBLISHES EVENTS:
 * - user.created
 * - user.updated
 * - user.deleted
 * - password.reset.requested
 *
 * SUBSCRIBES TO: None (this service does not consume events)
 *
 * DATA OWNED:
 * - User
 * - UserProfile
 * - PasswordResetToken
 */
@Module({
  imports: [
    // --- Core Infrastructure ---
    ConfigModule, // Environment configuration (JWT secrets, DB URL, etc.)
    DatabaseModule, // Prisma Client and database connection
    AuthModule, // JWT strategies, guards, decorators

    // --- Event-Driven Communication ---
    // Register messaging for publishing events to RabbitMQ
    // Queue name: 'accounts.events' - where this service publishes events
    MessagingModule.register({
      queue: 'accounts.events',
    }),

    // --- Observability ---
    // Structured logging, health checks, and metrics
    ObservabilityModule.register({
      serviceName: 'accounts-service',
      version: '1.0.0',
    }),
  ],

  // --- HTTP Layer ---
  controllers: [
    AuthController, // /auth/* and /profile endpoints
    UsersController, // /users/* (admin only)
  ],

  // --- Business Logic & Data Access ---
  providers: [
    UsersService, // User management business logic
    ProfileService, // Profile management business logic
    UsersRepository, // User data access layer
  ],

  // --- Exports (for testing or inter-module use) ---
  // Export services if other modules in the same app need them
  exports: [UsersService, ProfileService],
})
export class AccountsModule {}
