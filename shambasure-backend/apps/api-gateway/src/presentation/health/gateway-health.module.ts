import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { ConfigModule } from '@shamba/config';
import { ObservabilityModule } from '@shamba/observability';

import { ProxyModule } from '../../app.module';
import { DownstreamServicesHealthIndicator, HealthController } from './gateway-health.controller';

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
