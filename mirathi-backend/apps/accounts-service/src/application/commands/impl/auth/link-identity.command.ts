// src/application/commands/impl/auth/link-identity.command.ts
import { AuthProvider } from '@prisma/client';

export class LinkIdentityCommand {
  constructor(
    public readonly userId: string,
    public readonly provider: AuthProvider,
    public readonly providerUserId: string,
    public readonly email: string,
  ) {}
}
