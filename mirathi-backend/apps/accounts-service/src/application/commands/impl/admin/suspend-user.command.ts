// src/application/commands/impl/admin/suspend-user.command.ts
export class SuspendUserCommand {
  constructor(
    public readonly userId: string,
    public readonly suspendedBy: string,
    public readonly reason?: string,
  ) {}
}
