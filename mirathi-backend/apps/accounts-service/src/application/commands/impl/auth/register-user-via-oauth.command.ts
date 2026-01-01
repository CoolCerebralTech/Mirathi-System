// src/application/commands/impl/auth/register-user-via-oauth.command.ts
import { AuthProvider } from '@prisma/client';

export class RegisterUserViaOAuthCommand {
  constructor(
    public readonly provider: AuthProvider,
    public readonly providerUserId: string,
    public readonly email: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
  ) {}
}
