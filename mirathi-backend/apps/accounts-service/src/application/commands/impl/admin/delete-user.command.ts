// src/application/commands/impl/admin/delete-user.command.ts
export class DeleteUserCommand {
  constructor(
    public readonly userId: string,
    public readonly deletedBy: string,
  ) {}
}
