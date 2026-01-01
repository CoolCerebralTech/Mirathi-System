// src/application/user/commands/update-settings.command.ts

export interface UpdateSettingsCommandPayload {
  userId: string;
  language?: string;
  theme?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  marketingOptIn?: boolean;
}

export class UpdateSettingsCommand {
  constructor(public readonly payload: UpdateSettingsCommandPayload) {}
}
