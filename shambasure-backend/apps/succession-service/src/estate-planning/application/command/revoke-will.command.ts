// estate-planning/application/commands/revoke-will.command.ts
export class RevokeWillCommand {
  constructor(
    public readonly willId: string,
    public readonly revokedBy: string, // userId
    public readonly reason?: string,
  ) {}
}
