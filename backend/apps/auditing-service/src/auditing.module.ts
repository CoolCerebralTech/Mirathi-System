import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule'; 
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule, Queue } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { AuditingController } from './controllers/auditing.controller';
import { AuditingService } from './services/auditing.service';
import { AuditingRepository } from './repositories/auditing.repository';
import { SecurityAnalysisTask } from './tasks/security-analysis.task';

// ============================================================================
// Shamba Sure - Auditing Service Root Module
// ============================================================================
// This module assembles all components of the auditing microservice.
// It is an event-driven service that also exposes a read-only API for analysis.
// ============================================================================

@Module({
  imports: [
    // --- Core Shared Libraries ---
    ConfigModule,
    DatabaseModule,
    AuthModule, // Needed for protecting the API endpoints

    // --- NestJS Built-in Modules ---
    // Enable support for scheduled tasks (e.g., @Cron decorators).
    ScheduleModule.forRoot(),

    // --- Configurable Shared Libraries ---
    // Register the MessagingModule. This service is a major consumer of events,
    // so it requires its own dedicated, durable queue.
    MessagingModule.register({ queue: Queue.AUDITING_EVENTS }),

    // Register observability with the specific service name and version.
    ObservabilityModule.register({
      serviceName: 'auditing-service',
      version: '1.0.0',
    }),
  ],
  // The controller handles both consuming events and exposing the query API.
  controllers: [AuditingController],
  // The providers contain our business logic, data access, and scheduled tasks.
  providers: [AuditingService, AuditingRepository, SecurityAnalysisTask],
})
export class AuditingModule {}