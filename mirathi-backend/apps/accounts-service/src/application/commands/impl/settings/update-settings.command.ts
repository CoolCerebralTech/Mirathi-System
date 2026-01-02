// src/application/commands/impl/settings/update-settings.command.ts
import { Language, Theme } from '@prisma/client';

export class UpdateSettingsCommand {
  constructor(
    public readonly userId: string,
    public readonly language?: Language,
    public readonly theme?: Theme,
    public readonly emailNotifications?: boolean,
    public readonly smsNotifications?: boolean,
    public readonly pushNotifications?: boolean,
    public readonly marketingOptIn?: boolean,
  ) {}
}
