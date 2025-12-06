// apps/api-gateway/src/application/proxy.module.ts
import { Module } from '@nestjs/common';

import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ProxyService } from './services/proxy.service';

/**
 * ProxyModule - Application layer module
 *
 * This module encapsulates the core business logic of the API Gateway:
 * routing and proxying requests to microservices.
 *
 * It imports InfrastructureModule to get access to HttpClientService,
 * and exports ProxyService for use in the presentation layer.
 */
@Module({
  imports: [
    InfrastructureModule, // Provides HttpClientService
  ],
  providers: [
    ProxyService, // Main application service
  ],
  exports: [
    ProxyService, // Export for presentation layer
  ],
})
export class ProxyModule {}
