import { Module } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule, Queue } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { DocumentsController } from './controllers/documents.controller';
import { DocumentsService } from './services/documents.service';
import { DocumentsRepository } from './repositories/documents.repository';
import { StorageService } from './storage/storage.service';

// ============================================================================
// Shamba Sure - Documents Service Root Module
// ============================================================================
// This module assembles all components of the documents microservice.
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
    // This service only publishes events, so it doesn't need its own queue.
    MessagingModule.register({ }),

    // Register observability with the specific service name and version.
    ObservabilityModule.register({
      serviceName: 'documents-service',
      version: '1.0.0',
    }),
  ],
  controllers: [DocumentsController],
  // The providers now reflect our lean, refactored service layer.
  providers: [DocumentsService, DocumentsRepository, StorageService],
})
export class DocumentsModule {}