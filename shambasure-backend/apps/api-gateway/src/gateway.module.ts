// ============================================================================
// gateway.module.ts - API Gateway Root Module
// ============================================================================

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@shamba/config';
import { AuthModule } from '@shamba/auth';
import { ObservabilityModule } from '@shamba/observability';

import { HealthController } from './controllers/health.controller';
import { AccountsProxyController } from './proxy/accounts.proxy.controller';
import { DocumentsProxyController } from './proxy/documents.proxy.controller';
import { SuccessionProxyController } from './proxy/succession.proxy.controller';

/**
 * GatewayModule - Root module for API Gateway
 * 
 * RESPONSIBILITIES:
 * - Single entry point for all client requests
 * - Authentication and authorization at gateway level
 * - Request routing to downstream microservices
 * - Rate limiting and security
 * - Health checks and monitoring
 * 
 * ROUTES TO MICROSERVICES:
 * - /auth, /profile, /users → accounts-service
 * - /documents → documents-service
 * - /wills, /assets, /families → succession-service
 * 
 * DOES NOT:
 * - Route to notifications-service (internal event consumer)
 * - Route to auditing-service (internal event consumer)
 */
@Module({
  imports: [
    // --- Core Infrastructure ---
    ConfigModule,      // Environment configuration
    AuthModule,        // JWT validation for all proxied requests

    // --- HTTP Client for Proxying ---
    HttpModule.register({
      timeout: 60000,           // 60s for file uploads
      maxRedirects: 5,
      maxBodyLength: Infinity,  // Support large file uploads
      maxContentLength: Infinity,
    }),

    // --- Observability ---
    // Health checks, logging, and metrics
    ObservabilityModule.register({
      serviceName: 'api-gateway',
      version: '1.0.0',
    }),
  ],

  // --- Controllers ---
  controllers: [
    HealthController,              // /health endpoint
    AccountsProxyController,       // /auth, /profile, /users
    DocumentsProxyController,      // /documents
    SuccessionProxyController,     // /wills, /assets, /families
  ],
})
export class GatewayModule {}

