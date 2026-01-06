// apps/documents-service/src/document.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '@shamba/auth';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule, MessagingService } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

// Application Layer
import { DocumentService } from './application/services/document.service';
import { VerificationService } from './application/services/verification.service';
import { EncryptionService } from './infrastructure/encryption/encryption.service';
import { TesseractService } from './infrastructure/ocr/tesseract.service';
// Infrastructure Layer
import { DocumentRepository } from './infrastructure/repositories/document.repository';
import { MinioStorageService } from './infrastructure/storage/minio-storage.service';
// Injection Tokens
import {
  DOCUMENT_REPOSITORY,
  ENCRYPTION_SERVICE,
  EVENT_PUBLISHER,
  // The token DocumentService asks for
  OCR_SERVICE,
  STORAGE_SERVICE,
} from './injection.tokens';
// Presentation Layer
import { DocumentController } from './presentation/controllers/document.controller';
import { VerificationController } from './presentation/controllers/verification.controller';
import { HealthController } from './presentation/health/health.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    DatabaseModule,
    // Registers the module so MessagingService is available
    MessagingModule.register({}),
    ObservabilityModule.register({
      serviceName: 'documents-service',
      version: '1.0.0',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [DocumentController, VerificationController, HealthController],
  providers: [
    DocumentService,
    VerificationService,

    // Repositories
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: DocumentRepository,
    },

    // Infrastructure
    {
      provide: STORAGE_SERVICE,
      useClass: MinioStorageService,
    },
    {
      provide: OCR_SERVICE,
      useClass: TesseractService,
    },
    {
      provide: ENCRYPTION_SERVICE,
      useClass: EncryptionService,
    },

    // FIX 2: THE CRITICAL PART
    // When DocumentService requests @Inject(EVENT_PUBLISHER),
    // we give it the MessagingService instance.
    {
      provide: EVENT_PUBLISHER,
      useExisting: MessagingService,
    },
  ],
  exports: [DocumentService, VerificationService],
})
export class DocumentModule {}
