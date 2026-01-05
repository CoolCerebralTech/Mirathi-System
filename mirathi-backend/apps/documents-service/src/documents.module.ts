import { Module } from '@nestjs/common';

// --- SHARED LIBRARY IMPORTS ---
import { AuthModule } from '@shamba/auth';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { ObservabilityModule } from '@shamba/observability';

// --- LOCAL IMPORTS ---
import { MinioService } from './adapters/minio.service';
import { DocumentController } from './controllers/document.controller';
import { HealthController } from './health/health.controller';
import { DocumentService } from './services/document.service';
import { RetentionCronService } from './services/retention.cron';

@Module({
  imports: [
    // 1. Configuration
    ConfigModule,

    // 2. Database (Provides PrismaService)
    DatabaseModule,

    // 3. Authentication (Provides Guards & Strategies)
    AuthModule,

    // 4. Observability (Provides Logger, Metrics & Tracing)
    // This fixes the "Nest could not find Logger element" error
    ObservabilityModule.register({
      serviceName: 'documents-service',
      version: '1.0.0',
    }),
  ],
  controllers: [DocumentController, HealthController],
  providers: [
    // Business Logic
    DocumentService,

    // Adapters
    MinioService,

    // Background Jobs
    RetentionCronService,
  ],
  exports: [DocumentService],
})
export class DocumentsModule {}
