// src/application/user/commands/update-phone-number.command.ts

export interface UpdatePhoneNumberCommandPayload {
  userId: string;
  phoneNumber: string;
}

export class UpdatePhoneNumberCommand {
  constructor(public readonly payload: UpdatePhoneNumberCommandPayload) {}
}
