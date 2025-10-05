// ============================================================================
// notifications.module.ts - Notifications Service Root Module
// ============================================================================

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { NotificationsController } from './controllers/notifications.controller';
import { TemplatesController } from './controllers/templates.controller';
import { NotificationsService } from './services/notifications.service';
import { TemplatesService } from './services/templates.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { TemplatesRepository } from './repositories/templates.repository';
import { ProvidersModule } from './providers/providers.module';
import { EventsHandler } from './events/events.handler';
import { SchedulerService } from './events/scheduler.service';
import { DefaultTemplatesSeed } from './events/default-templates.seed';

/**
 * NotificationsModule - Root module for Notifications microservice
 * 
 * DOMAIN: Outbound Communications
 * 
 * RESPONSIBILITIES:
 * - Email and SMS delivery
 * - Template management
 * - Event-driven notification creation
 * - Scheduled notification processing
 * - Delivery tracking and retry logic
 * 
 * PUBLISHES EVENTS: None (this service only consumes)
 * 
 * SUBSCRIBES TO:
 * - user.created
 * - password.reset.requested
 * - will.created
 * - heir.assigned
 * - document.verified
 * 
 * DATA OWNED:
 * - Notification
 * - NotificationTemplate
 */
@Module({
  imports: [
    // --- Core Infrastructure ---
    ConfigModule,      // Environment configuration
    DatabaseModule,    // Prisma Client and database connection
    AuthModule,        // JWT validation for API endpoints

    // --- Scheduling ---
    // Enable cron jobs for notification processing
    ScheduleModule.forRoot(),

    // --- Event-Driven Communication ---
    // This service consumes events from other services
    // Queue name: 'notifications.events'
    MessagingModule.register({ 
      queue: 'notifications.events',
    }),

    // --- Observability ---
    // Structured logging, health checks, and metrics
    ObservabilityModule.register({
      serviceName: 'notifications-service',
      version: '1.0.0',
    }),

    // --- Notification Providers ---
    // Register email and SMS providers
    ProvidersModule.register(),
  ],

  // --- HTTP Layer ---
  controllers: [
    NotificationsController,  // /notifications endpoints
    TemplatesController,      // /templates endpoints (admin)
  ],

  // --- Business Logic & Data Access ---
  providers: [
    // Services
    NotificationsService,
    TemplatesService,
    
    // Repositories
    NotificationsRepository,
    TemplatesRepository,

    // Event Handlers
    EventsHandler,        // Listens to RabbitMQ events
    SchedulerService,     // Cron jobs for processing
    DefaultTemplatesSeed, // Seeds default templates on startup
  ],

  // --- Exports ---
  exports: [
    NotificationsService,
    TemplatesService,
  ],
})
export class NotificationsModule {}

