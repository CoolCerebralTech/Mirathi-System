// src/infrastructure/adapters/oauth/oauth-adapter.factory.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { OAuthProviderPort } from '../../../domain/ports/oauth-provider.port';
import { GoogleOAuthAdapter } from './google.adapter';

// Updated type definition to exclude APPLE
export type OAuthProviderType = 'GOOGLE';

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

  constructor(private readonly googleAdapter: GoogleOAuthAdapter) {}

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

      // Removed Apple initialization logic

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

  // Removed isAppleConfigured()

  getAdapter(provider: string): OAuthProviderPort {
    // Logic remains dynamic to handle potential future providers,
    // but currently only allows 'GOOGLE'
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

    // Removed APPLE from this record
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
   */
  static createManualAdapter(provider: OAuthProviderType): OAuthProviderPort {
    switch (provider.toUpperCase()) {
      case 'GOOGLE':
        return new GoogleOAuthAdapter();
      // Removed case 'APPLE'
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  /**
   * Validate all configured adapters
   */
  validateAdapters(): Promise<{ [key in OAuthProviderType]?: boolean }> {
    const results: { [key in OAuthProviderType]?: boolean } = {};

    for (const [provider] of this.adapterMap.entries()) {
      try {
        results[provider] = true;
      } catch (error) {
        this.logger.warn(`Adapter validation failed for ${provider}:`, error);
        results[provider] = false;
      }
    }

    return Promise.resolve(results);
  }

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
