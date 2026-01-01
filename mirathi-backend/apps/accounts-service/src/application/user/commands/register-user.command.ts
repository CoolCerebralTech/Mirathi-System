// src/application/user/commands/register-user.command.ts

export interface RegisterUserCommandPayload {
  provider: string;
  providerUserId: string;
  email?: string;
  firstName: string;
  lastName: string;
}

export class RegisterUserCommand {
  constructor(public readonly payload: RegisterUserCommandPayload) {}
}
