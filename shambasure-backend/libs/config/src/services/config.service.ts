import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Config } from '../types';

/**
 * ============================================================================
 * Shamba Sure - ConfigService Wrapper
 * ============================================================================
 * Provides a strongly-typed API for accessing validated configuration values.
 * ============================================================================
 */
@Injectable()
export class ConfigService {
  constructor(private readonly nestConfigService: NestConfigService<Config, true>) {}

  // Overload 1: known keys → strongly typed
  get<K extends keyof Config>(key: K): Config[K];

  // Overload 2: arbitrary string → string | undefined
  get(key: string): string | undefined;

  // Implementation
  get<K extends keyof Config>(key: K | string): Config[K] | string | undefined {
    return this.nestConfigService.get(key as keyof Config, { infer: true });
  }

  getOrThrow<K extends keyof Config>(key: K): NonNullable<Config[K]> {
    const value = this.get(key);
    if (value === undefined || value === null) {
      throw new Error(`Missing required configuration key: ${String(key)}`);
    }
    return value as NonNullable<Config[K]>;
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }
  get isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }
  get isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }
}
