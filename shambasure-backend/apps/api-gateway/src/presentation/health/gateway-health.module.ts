import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { ConfigModule } from '@shamba/config';
import { ObservabilityModule } from '@shamba/observability';

import { HealthController } from './gateway-health.controller';

@Module({
  imports: [TerminusModule, HttpModule, ObservabilityModule, ConfigModule],
  controllers: [HealthController],
  providers: [],
})
export class GatewayHealthModule {}
