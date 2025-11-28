// ============================================================================
// auditing.module.ts - Auditing Service Root Module
// ============================================================================
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '@shamba/auth';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { EventsHandler } from './events/events.handler';
import { SchedulerService as AuditSchedulerService } from './events/scheduler.service';
import { AuditingRepository } from './repositories/auditing.repository';
import { AuditingService } from './services/auditing.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    ScheduleModule.forRoot(),
    MessagingModule.register({}),
    ObservabilityModule.register({
      serviceName: 'auditing-service',
      version: '1.0.0',
    }),
  ],
  controllers: [
    EventsHandler, // Event consumer controller
  ],
  providers: [AuditingService, AuditingRepository, AuditSchedulerService],
  exports: [AuditingService],
})
export class AuditingModule {}
