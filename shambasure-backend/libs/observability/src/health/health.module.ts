import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { NotificationModule } from '@shamba/notification';

import { HealthService } from './health.service';

// Health indicators
import {
  MessagingHealthIndicator,
  PrismaHealthIndicator,
  NotificationHealthIndicator,
} from './indicators';

@Module({
  imports: [
    TerminusModule,
    ConfigModule,
    DatabaseModule,
    NotificationModule,
    MessagingModule.register({}),
  ],
  providers: [
    HealthService,
    MessagingHealthIndicator,
    PrismaHealthIndicator,
    NotificationHealthIndicator,
  ],
  exports: [
    HealthService,
    PrismaHealthIndicator,
    MessagingHealthIndicator,
    NotificationHealthIndicator,
  ],
})
export class HealthModule {}
