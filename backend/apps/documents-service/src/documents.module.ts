import { Module } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';
import { DocumentsController } from './controllers/documents.controller';
import { DocumentService } from './services/document.service';
import { VerificationService } from './services/verification.service';
import { DocumentRepository } from './repositories/document.repository';
import { StorageService } from './storage/storage.service';
import { DocumentEvents } from './events/document.events';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    MessagingModule.forRoot(),
    ObservabilityModule.forRoot(),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentService,
    VerificationService,
    DocumentRepository,
    StorageService,
    DocumentEvents,
  ],
  exports: [DocumentService, StorageService],
})
export class DocumentsModule {}