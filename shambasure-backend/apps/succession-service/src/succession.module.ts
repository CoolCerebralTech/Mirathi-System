// ============================================================================
// succession.module.ts - Succession Service Root Module
// ============================================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
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

/**
 * SuccessionModule - Root module for Succession microservice
 * 
 * DOMAIN: Estate & Succession Planning (Core Business Logic)
 * 
 * RESPONSIBILITIES:
 * - Will creation and management
 * - Asset registration and tracking
 * - Family tree management (HeirLink™)
 * - Beneficiary assignments
 * - Succession planning workflows
 * 
 * PUBLISHES EVENTS:
 * - asset.created
 * - asset.updated
 * - asset.deleted
 * - will.created
 * - will.updated
 * - heir.assigned
 * 
 * SUBSCRIBES TO:
 * - user.created (for creating default family)
 * - document.verified (for asset validation)
 * 
 * DATA OWNED:
 * - Will
 * - Asset
 * - BeneficiaryAssignment
 * - Family
 * - FamilyMember
 */
@Module({
  imports: [
    // --- Core Infrastructure ---
    ConfigModule,      // Environment configuration
    DatabaseModule,    // Prisma Client and database connection
    AuthModule,        // JWT strategies, guards, decorators

    // --- Event-Driven Communication ---
    // This service both publishes and consumes events
    // Queue name: 'succession.events'
    MessagingModule.register({ 
      queue: 'succession.events',
    }),

    // --- Observability ---
    // Structured logging, health checks, and metrics
    ObservabilityModule.register({
      serviceName: 'succession-service',
      version: '1.0.0',
    }),
  ],

  // --- HTTP Layer ---
  controllers: [
    AssetsController,    // /assets/* endpoints
    FamiliesController,  // /families/* endpoints
    WillsController,     // /wills/* endpoints
  ],

  // --- Business Logic & Data Access ---
  providers: [
    // Services
    AssetsService,
    FamiliesService,
    WillsService,
    
    // Repositories
    AssetsRepository,
    FamiliesRepository,
    WillsRepository,
  ],

  // --- Exports (for testing or inter-module use) ---
  exports: [
    AssetsService,
    FamiliesService,
    WillsService,
  ],
})
export class SuccessionModule {}

