import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule, Queue } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';

import { UsersService } from './services/users.service';
import { ProfileService } from './services/profile.service';
import { UsersRepository } from './repositories/users.repository';

// ============================================================================
// Shamba Sure - Accounts Service Root Module
// ============================================================================
// This is the main module that assembles all components of the accounts microservice.
// It imports our shared library modules and provides the service-specific
// controllers, services, and repositories.
// ============================================================================

@Module({
  imports: [
    // --- Core Shared Libraries ---
    ConfigModule,
    DatabaseModule,
    AuthModule,

    // --- Configurable Shared Libraries ---
    // Register the MessagingModule to publish events. This service does not
    // need its own queue as it only publishes, so we can pass null or an empty string.
    MessagingModule.register({ queue: 'accounts.events' }),

    // Register the ObservabilityModule, providing the service name and version
    // for structured logging, tracing, and metrics.
    ObservabilityModule.register({
      serviceName: 'accounts-service',
      version: '1.0.0', // This could come from package.json
    }),
  ],
  // The controllers are the entry points for API requests.
  controllers: [AuthController, UsersController],
  // The providers contain the business logic and data access layers.
  providers: [UsersService, ProfileService, UsersRepository],
})
export class AccountsModule {}