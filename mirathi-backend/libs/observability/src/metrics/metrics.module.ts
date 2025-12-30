import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { Registry, collectDefaultMetrics } from 'prom-client';

import { MetricsService } from './metrics.service';

@Module({})
export class MetricsModule implements OnModuleInit {
  private static readonly logger = new Logger('MetricsModule');

  /**
   * Configures the shared MetricsModule.
   * This should be imported once in the root module of each microservice.
   */
  static register(config: { serviceName: string; version: string }): any {
    const registry = new Registry();

    // Set default labels that will be applied to all metrics
    registry.setDefaultLabels({
      service: config.serviceName,
      version: config.version,
    });

    // Collect default Node.js and process metrics
    collectDefaultMetrics({ register: registry });

    const registryProvider = {
      provide: Registry,
      useValue: registry,
    };

    return {
      module: MetricsModule,
      providers: [MetricsService, registryProvider],
      exports: [MetricsService],
    };
  }

  onModuleInit() {
    MetricsModule.logger.log('MetricsModule initialized and collecting default metrics.');
  }
}
