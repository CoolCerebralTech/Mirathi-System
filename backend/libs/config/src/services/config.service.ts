import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Config, Environment } from '../types';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of the ConfigService
// ============================================================================
// This service provides a simple, strongly-typed API for accessing configuration.
// It is a thin wrapper around NestJS's underlying `@nestjs/config` service.
//
// All VALIDATION, PARSING, and DEFAULT VALUES are handled upstream by the
// `config.schema.ts` (Joi schema). If the application has started successfully,
// we can safely assume that all required configuration values are present
// and correctly typed.
//
// This service should NOT contain any complex logic, validation, or parsing.
// Its sole purpose is to provide a clean, type-safe interface.
// ============================================================================

@Injectable()
export class ConfigService {
  constructor(
    // We inject the NestJS ConfigService, but we specify our flattened `Config` interface
    // as the type argument. This gives us full type safety and autocompletion.
    private nestConfigService: NestConfigService<Config, true>,
  ) {}

  /**
   * Retrieves a configuration value in a type-safe manner.
   * @param key The key of the configuration property to retrieve.
   * @returns The value of the configuration property.
   */
  get<T extends keyof Config>(key: T): Config[T] {
    // The `true` in `NestConfigService<Config, true>` infers that all values are defined,
    // as our Joi schema has already validated and provided defaults.
    return this.nestConfigService.get(key, { infer: true });
  }

  /**

   * Checks if the current environment is production.
   * @returns `true` if NODE_ENV is 'production', otherwise `false`.
   */
  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  /**
   * Checks if the current environment is development.
   * @returns `true` if NODE_ENV is 'development', otherwise `false`.
   */
  get isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  /**
   * Checks if the current environment is test.
   * @returns `true` if NODE_ENV is 'test', otherwise `false`.
   */
  get isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }
}