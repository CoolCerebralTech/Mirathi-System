// src/document.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Shared Libraries
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';
import { ConfigModule, ConfigService } from '@shamba/config';

// Presentation Layer
import { HealthController } from './1_presentation/health/health.controller';
import { DocumentController } from './1_presentation/controllers/document.controller';
import { DocumentVersionController } from './1_presentation/controllers/document-version.controller';
import { DocumentVerificationController } from './1_presentation/controllers/document-verification.controller';

// Application Layer - Services
import { DocumentService } from './2_application/services/document.service';
import { DocumentVersionService } from './2_application/services/document-version.service';
import { DocumentVerificationService } from './2_application/services/document-verification.service';
import { StatisticsService } from './2_application/services/statistics.service';

// Application Layer - Mappers
import { DocumentMapper } from './2_application/mappers/document.mapper';
import { DocumentVersionMapper } from './2_application/mappers/document-version.mapper';
import { DocumentVerificationAttemptMapper } from './2_application/mappers/document-verification-attempt.mapper';
import { StatisticsMapper } from './2_application/mappers/statistics.mapper';
import { BulkOperationsMapper } from './2_application/mappers/bulk-operations.mapper';

// Infrastructure Layer - Repositories
import { PrismaDocumentRepository } from './4_infrastructure/repositories/prisma-document.repository';
import { PrismaDocumentVersionRepository } from './4_infrastructure/repositories/prisma-document-version.query.repository';
import { PrismaDocumentVerificationAttemptRepository } from './4_infrastructure/repositories/prisma-document-verification-attempt.repository';

// Infrastructure Layer - Storage
import { StorageService } from './4_infrastructure/storage/storage.service';
import { LocalStorageProvider } from './4_infrastructure/storage/providers/local-storage.provider';
import { FileValidatorService } from './4_infrastructure/storage/file-validator.service';

// Domain Interfaces (for dependency injection)
import { IDocumentRepository } from './3_domain/interfaces/document-repository.interface';
import { IDocumentVersionRepository } from './3_domain/interfaces/document-version.query.interface';
import { IDocumentVerificationAttemptRepository } from './3_domain/interfaces/document-verification.query.interface';
import { IStorageService } from './3_domain/interfaces/storage.service.interface';

@Module({
  imports: [
    // NestJS Modules
    EventEmitterModule.forRoot(),

    // Shared Library Modules
    DatabaseModule,
    AuthModule,
    MessagingModule,
    ObservabilityModule, // This provides the Logger
    ConfigModule,
  ],
  controllers: [
    HealthController,
    DocumentController,
    DocumentVersionController,
    DocumentVerificationController,
  ],
  providers: [
    // ============================================================================
    // APPLICATION SERVICES
    // ============================================================================
    DocumentService,
    DocumentVersionService,
    DocumentVerificationService,
    StatisticsService,

    // ============================================================================
    // APPLICATION MAPPERS
    // ============================================================================
    DocumentMapper,
    DocumentVersionMapper,
    DocumentVerificationAttemptMapper,
    StatisticsMapper,
    BulkOperationsMapper,

    // ============================================================================
    // INFRASTRUCTURE REPOSITORIES (Concrete Implementations)
    // ============================================================================
    {
      provide: IDocumentRepository,
      useClass: PrismaDocumentRepository,
    },
    {
      provide: IDocumentVersionRepository,
      useClass: PrismaDocumentVersionRepository,
    },
    {
      provide: IDocumentVerificationAttemptRepository,
      useClass: PrismaDocumentVerificationAttemptRepository,
    },

    // ============================================================================
    // INFRASTRUCTURE STORAGE SERVICES
    // ============================================================================
    {
      provide: IStorageService,
      useClass: StorageService,
    },
    LocalStorageProvider,
    FileValidatorService,

    // ============================================================================
    // PROVIDE STORAGE CONFIGURATION
    // ============================================================================
    {
      provide: 'STORAGE_CONFIG',
      useFactory: (configService: ConfigService) => ({
        basePath: configService.get('STORAGE_BASE_PATH') || './storage/documents',
        maxFileSize: configService.get('MAX_FILE_SIZE') || 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
      }),
      inject: [ConfigService],
    },
  ],
  exports: [
    // Export services that might be used by other modules
    DocumentService,
    IStorageService,
  ],
})
export class DocumentModule {}
