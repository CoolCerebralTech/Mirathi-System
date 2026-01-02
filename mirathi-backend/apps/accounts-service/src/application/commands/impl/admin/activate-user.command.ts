// src/application/commands/impl/admin/activate-user.command.ts
export class ActivateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly activatedBy: string,
  ) {}
}
