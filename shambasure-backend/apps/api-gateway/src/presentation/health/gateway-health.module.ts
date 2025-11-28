import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ObservabilityModule } from '@shamba/observability';
import { ConfigModule } from '@shamba/config';

import { HealthController, DownstreamServicesHealthIndicator } from './health.controller';
import { ProxyModule } from '../../app.module';

@Module({
  imports: [TerminusModule, ObservabilityModule, ConfigModule, ProxyModule],
  controllers: [HealthController],
  providers: [
    // --- THIS IS THE CRITICAL ADDITION ---
    // You must provide the custom indicator so NestJS can inject it
    // into the HealthController.
    DownstreamServicesHealthIndicator,
  ],
})
export class GatewayHealthModule {}
