import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

// --- Shared Libraries (Foundational) ---
// These provide the core, cross-cutting concerns for the entire service.
import { ConfigModule } from '@shamba/config';
import { AuthModule, JwtAuthGuard } from '@shamba/auth';
import { ObservabilityModule } from '@shamba/observability';
import { MessagingModule } from '@shamba/messaging';

// --- Local Feature & Layer Modules ---
// These are the encapsulated layers of our API Gateway.
import { InfrastructureModule } from './4_infrastructure/infrastructure.module';
import { ProxyModule } from './2_application/proxy.module';
import { GatewayHealthModule } from './1_presentation/health/gateway-health.module'; // Corrected Path
import { ProxyController } from './1_presentation/controller/proxy.controller';
import { AllExceptionsFilter } from './1_presentation/filters/all-exceptions.filter';

/**
 * AppModule - The root module for the API Gateway.
 *
 * This module's primary responsibility is to assemble all other modules
 * and establish the application's global providers (guards, filters).
 * It follows a clean architecture by importing encapsulated modules for each layer.
 */
@Module({
  imports: [
    // --- 1. Foundational Shared Libraries ---
    ConfigModule,
    AuthModule,
    ObservabilityModule.register({ serviceName: 'api-gateway', version: '1.0.0' }),
    MessagingModule.register({}),

    // --- 2. Local Layer Modules ---
    // The InfrastructureModule provides the concrete tools (HTTP client, router).
    InfrastructureModule,

    // The ProxyModule contains the core application logic (the "use case").
    ProxyModule,

    // The GatewayHealthModule provides the health check endpoints.
    GatewayHealthModule,
  ],

  // --- 3. Presentation Layer Controllers ---
  // We only declare the top-level controllers here.
  controllers: [
    ProxyController, // The catch-all controller for all proxied requests.
  ],

  // --- 4. Global Providers (Guards, Filters, Interceptors) ---
  // These providers are applied to every route in the entire application.
  providers: [
    {
      // The JwtAuthGuard from our @shamba/auth library will protect
      // every single endpoint by default. We use @Public() to opt-out.
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      // Our custom AllExceptionsFilter will catch any unhandled error
      // and format it into a consistent JSON response.
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
export { ProxyModule };

