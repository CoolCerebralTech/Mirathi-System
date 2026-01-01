// src/application/user/commands/suspend-user.command.ts

export interface SuspendUserCommandPayload {
  userId: string;
  suspendedBy: string;
  reason?: string;
}

export class SuspendUserCommand {
  constructor(public readonly payload: SuspendUserCommandPayload) {}
}
