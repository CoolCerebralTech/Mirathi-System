import { Module } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule, Queue } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { AssetsController } from './controllers/assets.controller';
import { FamiliesController } from './controllers/families.controller';
import { WillsController } from './controllers/wills.controller';

import { AssetsService } from './services/assets.service';
import { FamiliesService } from './services/families.service';
import { WillsService } from './services/wills.service';

import { AssetsRepository } from './repositories/assets.repository';
import { FamiliesRepository } from './repositories/families.repository';
import { WillsRepository } from './repositories/wills.repository';

// ============================================================================
// Shamba Sure - Succession Service Root Module
// ============================================================================
// This is the main module that assembles all components of the succession microservice.
// It is the core business logic engine for the entire platform.
// ============================================================================

@Module({
  imports: [
    // --- Core Shared Libraries ---
    ConfigModule,
    DatabaseModule,
    AuthModule,

    // --- Configurable Shared Libraries ---
    // Register the MessagingModule. This service both publishes events (e.g., will.created)
    // and consumes them (e.g., user.created), so it needs its own dedicated queue.
    MessagingModule.register({ queue: Queue.SUCCESSION_EVENTS }),

    // Register observability with the specific service name and version.
    ObservabilityModule.register({
      serviceName: 'succession-service',
      version: '1.0.0',
    }),
  ],
  // All controllers that expose this service's API endpoints.
  controllers: [AssetsController, FamiliesController, WillsController],
  // All providers containing business logic and data access layers.
  providers: [
    AssetsService,
    FamiliesService,
    WillsService,
    AssetsRepository,
    FamiliesRepository,
    WillsRepository,
  ],
})
export class SuccessionModule {}