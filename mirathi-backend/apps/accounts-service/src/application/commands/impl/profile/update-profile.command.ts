// src/application/commands/impl/profile/update-profile.command.ts
export class UpdateProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly avatarUrl?: string,
    public readonly phoneNumber?: string,
    public readonly county?: string,
    public readonly physicalAddress?: string,
    public readonly postalAddress?: string,
  ) {}
}
