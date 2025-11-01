import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Config } from '../types';

/**
 * ============================================================================
 * Shamba Sure – Typed ConfigService Wrapper
 * ============================================================================
 * Provides a strongly typed API for accessing validated configuration values.
 * Adds default-value support while preserving type safety.
 * ============================================================================
 */
@Injectable()
export class ConfigService extends NestConfigService<Config, true> {
  constructor(nestConfigService: NestConfigService<Config, true>) {
    // ✅ Properly call parent constructor
    super(nestConfigService);
  }

  // --------------------------------------------------------------------------
  // Typed get() overloads with optional default value support
  // --------------------------------------------------------------------------
  override get<K extends keyof Config>(key: K): Config[K];
  override get<K extends keyof Config>(key: K, defaultValue: Config[K]): Config[K];
  override get(key: string): string | undefined;
  override get<K extends keyof Config>(
    key: K | string,
    defaultValue?: Config[K],
  ): Config[K] | string | undefined {
    const value = super.get(key as keyof Config, { infer: true });
    return (value ?? defaultValue) as Config[K];
  }

  // --------------------------------------------------------------------------
  // Strict getter that throws if the key is missing
  // --------------------------------------------------------------------------
  getOrThrow<K extends keyof Config>(key: K): NonNullable<Config[K]> {
    const value = this.get(key);
    if (value === undefined || value === null) {
      throw new Error(`Missing required configuration key: ${String(key)}`);
    }
    return value as NonNullable<Config[K]>;
  }

  // --------------------------------------------------------------------------
  // Convenience environment flags
  // --------------------------------------------------------------------------
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
