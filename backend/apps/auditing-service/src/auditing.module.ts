import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';
import { AuditController } from './controllers/audit.controller';
import { AuditService } from './services/audit.service';
import { AuditReportService } from './reports/audit-report.service';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { SecurityEventRepository } from './repositories/security-event.repository';
import { AuditEventConsumer } from './consumers/audit-event.consumer';
import { SecurityAnalysisProcessor } from './processors/security-analysis.processor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DatabaseModule,
    AuthModule,
    MessagingModule.forRoot(),
    ObservabilityModule.forRoot(),
  ],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditReportService,
    AuditLogRepository,
    SecurityEventRepository,
    AuditEventConsumer,
    SecurityAnalysisProcessor,
  ],
  exports: [AuditService],
})
export class AuditingModule {}