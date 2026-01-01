// src/application/user/commands/verify-phone.command.ts

export interface VerifyPhoneCommandPayload {
  userId: string;
}

export class VerifyPhoneCommand {
  constructor(public readonly payload: VerifyPhoneCommandPayload) {}
}
