// src/application/commands/impl/admin/change-user-role.command.ts
import { UserRole } from '@prisma/client';

export class ChangeUserRoleCommand {
  constructor(
    public readonly userId: string,
    public readonly newRole: UserRole,
    public readonly changedBy: string,
    public readonly reason?: string,
  ) {}
}
