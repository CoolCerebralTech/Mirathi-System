// src/domain/entities/user-settings.entity.ts
import { Language, Theme } from '@prisma/client';

import { Timestamp } from '../value-objects';

/**
 * User Settings Entity
 * Aligned with schema: UserSettings model
 *
 * Business Rules:
 * 1. Default values for all settings
 * 2. Settings can only be updated by the user
 */
export interface UserSettingsProps {
  id: string;
  userId: string; // Reference to User aggregate root
  language: Language;
  theme: Theme;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingOptIn: boolean;
  updatedAt: Timestamp;
}

export class UserSettings {
  private readonly _id: string;
  private readonly _userId: string;
  private _language: Language;
  private _theme: Theme;
  private _emailNotifications: boolean;
  private _smsNotifications: boolean;
  private _pushNotifications: boolean;
  private _marketingOptIn: boolean;
  private _updatedAt: Timestamp;

  constructor(props: UserSettingsProps) {
    this.validate(props);

    this._id = props.id;
    this._userId = props.userId;
    this._language = props.language;
    this._theme = props.theme;
    this._emailNotifications = props.emailNotifications;
    this._smsNotifications = props.smsNotifications;
    this._pushNotifications = props.pushNotifications;
    this._marketingOptIn = props.marketingOptIn;
    this._updatedAt = props.updatedAt;
  }

  private validate(props: UserSettingsProps): void {
    if (!props.id) {
      throw new Error('UserSettings must have an id');
    }

    if (!props.userId) {
      throw new Error('UserSettings must have a userId');
    }
  }

  /**
   * Factory method to create default UserSettings
   */
  static create(props: { id: string; userId: string }): UserSettings {
    return new UserSettings({
      id: props.id,
      userId: props.userId,
      language: Language.ENGLISH,
      theme: Theme.SYSTEM,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      marketingOptIn: false,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Factory method to recreate from persistence
   */
  static fromPersistence(props: {
    id: string;
    userId: string;
    language: Language;
    theme: Theme;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingOptIn: boolean;
    updatedAt: Date;
  }): UserSettings {
    return new UserSettings({
      id: props.id,
      userId: props.userId,
      language: props.language,
      theme: props.theme,
      emailNotifications: props.emailNotifications,
      smsNotifications: props.smsNotifications,
      pushNotifications: props.pushNotifications,
      marketingOptIn: props.marketingOptIn,
      updatedAt: Timestamp.create(props.updatedAt),
    });
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get language(): Language {
    return this._language;
  }

  get theme(): Theme {
    return this._theme;
  }

  get emailNotifications(): boolean {
    return this._emailNotifications;
  }

  get smsNotifications(): boolean {
    return this._smsNotifications;
  }

  get pushNotifications(): boolean {
    return this._pushNotifications;
  }

  get marketingOptIn(): boolean {
    return this._marketingOptIn;
  }

  get updatedAt(): Timestamp {
    return this._updatedAt;
  }

  // Business Methods
  updateLanguage(language: Language): void {
    if (language !== this._language) {
      this._language = language;
      this._updatedAt = Timestamp.now();
    }
  }

  updateTheme(theme: Theme): void {
    if (theme !== this._theme) {
      this._theme = theme;
      this._updatedAt = Timestamp.now();
    }
  }

  updateEmailNotifications(enabled: boolean): void {
    if (enabled !== this._emailNotifications) {
      this._emailNotifications = enabled;
      this._updatedAt = Timestamp.now();
    }
  }

  updateSmsNotifications(enabled: boolean): void {
    if (enabled !== this._smsNotifications) {
      this._smsNotifications = enabled;
      this._updatedAt = Timestamp.now();
    }
  }

  updatePushNotifications(enabled: boolean): void {
    if (enabled !== this._pushNotifications) {
      this._pushNotifications = enabled;
      this._updatedAt = Timestamp.now();
    }
  }

  updateMarketingOptIn(optIn: boolean): void {
    if (optIn !== this._marketingOptIn) {
      this._marketingOptIn = optIn;
      this._updatedAt = Timestamp.now();
    }
  }

  updateAllNotifications(props: { email?: boolean; sms?: boolean; push?: boolean }): void {
    let changed = false;

    if (props.email !== undefined && props.email !== this._emailNotifications) {
      this._emailNotifications = props.email;
      changed = true;
    }

    if (props.sms !== undefined && props.sms !== this._smsNotifications) {
      this._smsNotifications = props.sms;
      changed = true;
    }

    if (props.push !== undefined && props.push !== this._pushNotifications) {
      this._pushNotifications = props.push;
      changed = true;
    }

    if (changed) {
      this._updatedAt = Timestamp.now();
    }
  }

  /**
   * Check if any notifications are enabled
   */
  get hasNotificationsEnabled(): boolean {
    return this._emailNotifications || this._smsNotifications || this._pushNotifications;
  }

  /**
   * Check if user can receive a specific type of notification
   * based on their settings
   */
  canReceiveNotification(type: 'email' | 'sms' | 'push'): boolean {
    switch (type) {
      case 'email':
        return this._emailNotifications;
      case 'sms':
        return this._smsNotifications;
      case 'push':
        return this._pushNotifications;
      default:
        return false;
    }
  }

  /**
   * Get notification preferences as an object
   */
  get notificationPreferences() {
    return {
      email: this._emailNotifications,
      sms: this._smsNotifications,
      push: this._pushNotifications,
    };
  }

  /**
   * For persistence
   */
  toPersistence() {
    return {
      id: this._id,
      userId: this._userId,
      language: this._language,
      theme: this._theme,
      emailNotifications: this._emailNotifications,
      smsNotifications: this._smsNotifications,
      pushNotifications: this._pushNotifications,
      marketingOptIn: this._marketingOptIn,
      updatedAt: this._updatedAt.value,
    };
  }
}
