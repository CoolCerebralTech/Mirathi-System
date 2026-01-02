// src/application/commands/impl/admin/unsuspend-user.command.ts
export class UnsuspendUserCommand {
  constructor(
    public readonly userId: string,
    public readonly unsuspendedBy: string,
  ) {}
}
