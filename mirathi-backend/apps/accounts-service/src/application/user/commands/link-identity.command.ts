// src/application/user/commands/link-identity.command.ts

export interface LinkIdentityCommandPayload {
  userId: string;
  provider: string;
  providerUserId: string;
  email?: string;
}

export class LinkIdentityCommand {
  constructor(public readonly payload: LinkIdentityCommandPayload) {}
}
