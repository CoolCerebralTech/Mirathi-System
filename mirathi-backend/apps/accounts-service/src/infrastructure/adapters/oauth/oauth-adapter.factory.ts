// src/infrastructure/adapters/oauth/oauth-adapter.factory.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { OAuthProviderPort } from '../../../domain/ports/oauth-provider.port';
import { AppleOAuthAdapter } from './apple.adapter';
import { GoogleOAuthAdapter } from './google.adapter';

export type OAuthProviderType = 'GOOGLE' | 'APPLE';

export interface OAuthProviderInfo {
  type: OAuthProviderType;
  name: string;
  enabled: boolean;
  scopes: string[];
}

@Injectable()
export class OAuthAdapterFactory implements OnModuleInit {
  private readonly logger = new Logger(OAuthAdapterFactory.name);
  private readonly adapterMap = new Map<OAuthProviderType, OAuthProviderPort>();

  constructor(
    private readonly googleAdapter: GoogleOAuthAdapter,
    private readonly appleAdapter: AppleOAuthAdapter,
  ) {}

  onModuleInit() {
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    try {
      // Initialize Google adapter if configured
      if (this.isGoogleConfigured()) {
        this.adapterMap.set('GOOGLE', this.googleAdapter);
        this.logger.log('Google OAuth adapter initialized');
      } else {
        this.logger.warn('Google OAuth adapter is not configured');
      }

      // Initialize Apple adapter if configured
      if (this.isAppleConfigured()) {
        this.adapterMap.set('APPLE', this.appleAdapter);
        this.logger.log('Apple OAuth adapter initialized');
      } else {
        this.logger.warn('Apple OAuth adapter is not configured');
      }

      if (this.adapterMap.size === 0) {
        this.logger.warn('No OAuth providers are configured');
      }
    } catch (error) {
      this.logger.error('Failed to initialize OAuth adapters', error);
      throw error;
    }
  }

  private isGoogleConfigured(): boolean {
    return !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  private isAppleConfigured(): boolean {
    return !!(
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY &&
      process.env.APPLE_REDIRECT_URI
    );
  }

  // Simplified type signature to avoid redundant constituents
  getAdapter(provider: string): OAuthProviderPort {
    const normalizedProvider = provider.toUpperCase() as OAuthProviderType;

    if (!this.isProviderSupported(normalizedProvider)) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const adapter = this.adapterMap.get(normalizedProvider);
    if (!adapter) {
      throw new Error(`OAuth provider not initialized or configured: ${provider}`);
    }

    return adapter;
  }

  tryGetAdapter(provider: string): OAuthProviderPort | null {
    try {
      return this.getAdapter(provider);
    } catch {
      return null;
    }
  }

  getAllAdapters(): Map<OAuthProviderType, OAuthProviderPort> {
    return new Map(this.adapterMap);
  }

  getAllActiveAdapters(): OAuthProviderPort[] {
    return Array.from(this.adapterMap.values());
  }

  getSupportedProviders(): OAuthProviderType[] {
    return Array.from(this.adapterMap.keys());
  }

  getProviderInfo(provider: OAuthProviderType): OAuthProviderInfo | null {
    if (!this.adapterMap.has(provider)) {
      return null;
    }

    const info: Record<OAuthProviderType, OAuthProviderInfo> = {
      GOOGLE: {
        type: 'GOOGLE',
        name: 'Google',
        enabled: this.isGoogleConfigured(),
        scopes: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
      },
      APPLE: {
        type: 'APPLE',
        name: 'Apple',
        enabled: this.isAppleConfigured(),
        scopes: ['name', 'email'],
      },
    };

    return info[provider];
  }

  getAllProviderInfo(): OAuthProviderInfo[] {
    return this.getSupportedProviders()
      .map((provider) => this.getProviderInfo(provider))
      .filter((info): info is OAuthProviderInfo => info !== null);
  }

  isProviderSupported(provider: string): boolean {
    const normalizedProvider = provider.toUpperCase() as OAuthProviderType;
    return this.adapterMap.has(normalizedProvider);
  }

  isProviderEnabled(provider: string): boolean {
    const normalizedProvider = provider.toUpperCase() as OAuthProviderType;
    return this.adapterMap.has(normalizedProvider) && this.isProviderSupported(normalizedProvider);
  }

  getAuthorizationUrl(provider: OAuthProviderType, state: string, redirectUri: string): string {
    const adapter = this.getAdapter(provider);
    return adapter.getAuthorizationUrl(state, redirectUri);
  }

  async validateIdToken(provider: OAuthProviderType, idToken: string) {
    const adapter = this.getAdapter(provider);
    return adapter.validateIdToken(idToken);
  }

  async exchangeCode(provider: OAuthProviderType, code: string, redirectUri: string) {
    const adapter = this.getAdapter(provider);
    return adapter.exchangeCodeForToken(code, redirectUri);
  }

  /**
   * Factory method to create adapter instance (for manual creation)
   * Note: This bypasses NestJS DI, use only if absolutely necessary
   */
  static createManualAdapter(provider: OAuthProviderType): OAuthProviderPort {
    switch (provider.toUpperCase()) {
      case 'GOOGLE':
        return new GoogleOAuthAdapter();
      case 'APPLE':
        return new AppleOAuthAdapter();
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  /**
   * Validate all configured adapters
   */
  // FIX: Removed async to resolve eslint error.
  validateAdapters(): Promise<{ [key in OAuthProviderType]?: boolean }> {
    const results: { [key in OAuthProviderType]?: boolean } = {};

    for (const [provider] of this.adapterMap.entries()) {
      try {
        // Validation logic would go here.
        // For now, existence in the map implies basic configuration success.
        results[provider] = true;
      } catch (error) {
        this.logger.warn(`Adapter validation failed for ${provider}:`, error);
        results[provider] = false;
      }
    }

    return Promise.resolve(results);
  }

  /**
   * Get adapter statistics (for monitoring)
   */
  getAdapterStats(): {
    totalAdapters: number;
    enabledAdapters: number;
    providers: OAuthProviderType[];
    adapterStates: { [key in OAuthProviderType]?: boolean };
  } {
    const providers = this.getSupportedProviders();
    const adapterStates = Object.fromEntries(
      providers.map((provider) => [provider, this.adapterMap.has(provider)]),
    );

    return {
      totalAdapters: providers.length,
      enabledAdapters: providers.filter((p) => this.adapterMap.has(p)).length,
      providers,
      adapterStates,
    };
  }
}
