// ============================================================================
// auditing.module.ts - Auditing Service Root Module
// ============================================================================

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { AuditingController } from './controllers/auditing.controller';
import { AuditingService } from './services/auditing.service';
import { AuditingRepository } from './repositories/auditing.repository';
import { EventsHandler } from './events/events.handler';
import { SchedulerService as AuditSchedulerService } from './events/scheduler.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    ScheduleModule.forRoot(),
    MessagingModule.register({ queue: 'auditing.events' }),
    ObservabilityModule.register({
      serviceName: 'auditing-service',
      version: '1.0.0',
    }),
  ],
  controllers: [
    AuditingController,
    EventsHandler, // Event consumer controller
  ],
  providers: [
    AuditingService,
    AuditingRepository,
    AuditSchedulerService,
  ],
  exports: [AuditingService],
})
export class AuditingModule {}
