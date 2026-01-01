// src/infrastructure/adapters/oauth/oauth-adapter.factory.ts
import { Injectable } from '@nestjs/common';

import { OAuthProviderPort } from '../../../domain/ports/oauth-provider.port';
import { AppleOAuthAdapter } from './apple.adapter';
import { GoogleOAuthAdapter } from './google.adapter';

export type OAuthProviderType = 'GOOGLE' | 'APPLE';

@Injectable()
export class OAuthAdapterFactory {
  constructor(
    private readonly googleAdapter: GoogleOAuthAdapter,
    private readonly appleAdapter: AppleOAuthAdapter,
  ) {}

  getAdapter(provider: OAuthProviderType): OAuthProviderPort {
    switch (provider.toUpperCase()) {
      case 'GOOGLE':
        return this.googleAdapter;
      case 'APPLE':
        return this.appleAdapter;
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  getAllAdapters(): Record<OAuthProviderType, OAuthProviderPort> {
    return {
      GOOGLE: this.googleAdapter,
      APPLE: this.appleAdapter,
    };
  }

  getSupportedProviders(): OAuthProviderType[] {
    return ['GOOGLE', 'APPLE'];
  }

  isProviderSupported(provider: string): boolean {
    return this.getSupportedProviders()
      .map((p) => p.toUpperCase())
      .includes(provider.toUpperCase());
  }
}
