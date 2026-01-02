// src/application/commands/impl/profile/update-phone-number.command.ts
export class UpdatePhoneNumberCommand {
  constructor(
    public readonly userId: string,
    public readonly phoneNumber?: string,
  ) {}
}
