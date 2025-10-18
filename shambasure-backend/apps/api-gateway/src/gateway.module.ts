// ============================================================================
// gateway.module.ts - API Gateway Root Module
// ============================================================================

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@shamba/config';
import { AuthModule, JwtAuthGuard } from '@shamba/auth';
import { ObservabilityModule } from '@shamba/observability';
import { MessagingModule } from '@shamba/messaging';
import { APP_GUARD } from '@nestjs/core';

import { HealthController } from './controllers/health.controller';
import { HealthService } from './health/health.service';
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
    ConfigModule, // Environment configuration
    AuthModule, // JWT validation for all proxied requests

    // --- Event-Driven Communication ---
    // ADDED: Register messaging for publishing events to other services if needed.
    // Even if the gateway doesn't publish, this initializes the connection.
    MessagingModule.register({
      queue: 'gateway.events', // The gateway can have its own queue if needed
    }),

    // --- HTTP Client for Proxying & Health Checks ---
    HttpModule.register({
      timeout: 60000, // 60s for file uploads
      maxRedirects: 5,
      maxBodyLength: Infinity, // Support large file uploads
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
    HealthController, // /health endpoint
    AccountsProxyController, // /auth, /profile, /users
    DocumentsProxyController, // /documents
    SuccessionProxyController, // /wills, /assets, /families
  ],

  // --- Providers ---
  // Services used within this module (e.g., by the controllers)
  providers: [
    HealthService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class GatewayModule {}
