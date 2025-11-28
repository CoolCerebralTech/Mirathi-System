import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@shamba/config';

// Import the interfaces that will be used as injection tokens

// Import the concrete implementations of our services
import { HttpClientService } from './http/http-client.service';
import { ServiceRouterService } from './routing/service-router.service';

/**
 * InfrastructureModule
 *
 * This module encapsulates all external-facing concerns of the API Gateway,
 * such as making HTTP calls and handling route configurations. It provides
 * concrete implementations for the application layer's interfaces.
 *
 * By providing interfaces and exporting them, we ensure that the rest of the
 * application depends on abstractions, not on concrete implementations,
 * following the Dependency Inversion Principle.
 */
@Module({
  imports: [
    // Import HttpModule to make Nest's HttpService available for injection.
    // We can configure it with default timeouts, etc.
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: Number(configService.get('HTTP_TIMEOUT' as any) ?? 30000),
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
    ConfigModule, // Needed for configuration values
  ],
  providers: [
    // Here, we tell NestJS's dependency injection system how to resolve our interfaces.
    {
      provide: 'IHttpClient', // When a service asks for 'IHttpClient'...
      useClass: HttpClientService, // ...provide an instance of HttpClientService.
    },
    {
      provide: 'IServiceRouter', // When a service asks for 'IServiceRouter'...
      useClass: ServiceRouterService, // ...provide an instance of ServiceRouterService.
    },
  ],
  exports: [
    // We export the interfaces so that other modules that import InfrastructureModule
    // can inject services based on these tokens.
    'IHttpClient',
    'IServiceRouter',
  ],
})
export class InfrastructureModule {}
