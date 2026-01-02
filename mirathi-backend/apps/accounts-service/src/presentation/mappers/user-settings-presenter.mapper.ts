// src/presentation/mappers/user-settings-presenter.mapper.ts
import { Injectable } from '@nestjs/common';

import { UserSettings } from '../../domain/entities';
import { UserSettingsOutput } from '../dtos/outputs';

/**
 * Maps UserSettings entity to GraphQL output
 */
@Injectable()
export class UserSettingsPresenterMapper {
  toOutput(settings: UserSettings): UserSettingsOutput {
    return {
      id: settings.id,
      language: settings.language,
      theme: settings.theme,
      emailNotifications: settings.emailNotifications,
      smsNotifications: settings.smsNotifications,
      pushNotifications: settings.pushNotifications,
      marketingOptIn: settings.marketingOptIn,
      updatedAt: settings.updatedAt.value,
    };
  }
}
