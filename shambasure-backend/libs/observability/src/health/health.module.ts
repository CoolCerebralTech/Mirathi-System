import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';

import { HealthService } from './health.service';
import { MessagingHealthIndicator } from './messaging-health.indicator';

@Module({
  imports: [
    TerminusModule,
    DatabaseModule,
    // CORRECTED: Call the .register() method for the dynamic module
    MessagingModule.register({ queue: 'health-check-queue' }),
  ],
  providers: [HealthService, MessagingHealthIndicator],
  exports: [HealthService],
})
export class HealthModule {}
