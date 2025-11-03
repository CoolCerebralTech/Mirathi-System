import { Module } from '@nestjs/common';
import { TerminusModule, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import * as checkDiskSpace from 'check-disk-space';
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
    MemoryHealthIndicator,
    DiskHealthIndicator,

    {
      provide: 'CheckDiskSpaceLib', // This is the token NestJS was looking for
      useValue: checkDiskSpace, // Provide the library we just imported
    },
  ],
  exports: [
    HealthService,
    PrismaHealthIndicator,
    MessagingHealthIndicator,
    NotificationHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
  ],
})
export class HealthModule {}
