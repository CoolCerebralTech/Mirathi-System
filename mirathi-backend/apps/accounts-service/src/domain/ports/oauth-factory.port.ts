import { OAuthProviderPort } from './oauth-provider.port';

export abstract class OAuthFactoryPort {
  abstract getAdapter(provider: string): OAuthProviderPort;
}

export const OAUTH_FACTORY_PORT = 'OAUTH_FACTORY_PORT';
