// ============================================================================
// documents.module.ts - Documents Service Root Module
// ============================================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { DocumentsController } from './controllers/documents.controller';
import { DocumentsService } from './services/documents.service';
import { DocumentsRepository } from './repositories/documents.repository';
import { StorageService } from './storage/storage.service';

/**
 * DocumentsModule - Root module for Documents microservice
 * 
 * DOMAIN: Document Lifecycle Management
 * 
 * RESPONSIBILITIES:
 * - Document upload and storage
 * - Version control and history
 * - Document verification workflow
 * - File download and retrieval
 * - Storage management
 * 
 * PUBLISHES EVENTS:
 * - document.uploaded
 * - document.verified
 * - document.deleted
 * 
 * SUBSCRIBES TO: None (this service does not consume events)
 * 
 * DATA OWNED:
 * - Document
 * - DocumentVersion
 */
@Module({
  imports: [
    // --- Core Infrastructure ---
    ConfigModule,      // Environment configuration
    DatabaseModule,    // Prisma Client and database connection
    AuthModule,        // JWT strategies, guards, decorators

    // --- Event-Driven Communication ---
    // Register messaging for publishing events to RabbitMQ
    // Queue name: 'documents.events' - where this service publishes events
    MessagingModule.register({ 
      queue: 'documents.events',
    }),

    // --- Observability ---
    // Structured logging, health checks, and metrics
    ObservabilityModule.register({
      serviceName: 'documents-service',
      version: '1.0.0',
    }),
  ],

  // --- HTTP Layer ---
  controllers: [
    DocumentsController,  // /documents/* endpoints
  ],

  // --- Business Logic & Data Access ---
  providers: [
    DocumentsService,     // Document management business logic
    DocumentsRepository,  // Document data access layer
    StorageService,       // File storage abstraction
  ],

  // --- Exports (for testing or inter-module use) ---
  exports: [
    DocumentsService,
    StorageService,
  ],
})
export class DocumentsModule {}

