// src/application/services/user.service.ts
import { Injectable, Logger } from '@nestjs/common';

import { User } from '../../domain/aggregates/user.aggregate';
import {
  CompleteOnboardingHandler,
  LinkIdentityHandler,
  RegisterUserViaOAuthHandler,
} from '../commands/handlers/auth';
import { UpdatePhoneNumberHandler, UpdateProfileHandler } from '../commands/handlers/profile';
import { UpdateSettingsHandler } from '../commands/handlers/settings';
import {
  CompleteOnboardingCommand,
  LinkIdentityCommand,
  RegisterUserViaOAuthCommand,
} from '../commands/impl/auth';
import { UpdatePhoneNumberCommand, UpdateProfileCommand } from '../commands/impl/profile';
import { UpdateSettingsCommand } from '../commands/impl/settings';
import {
  GetCurrentUserHandler,
  GetUserByEmailHandler,
  GetUserByIdHandler,
  GetUserByPhoneHandler,
} from '../queries/handlers';
import {
  GetCurrentUserQuery,
  GetUserByEmailQuery,
  GetUserByIdQuery,
  GetUserByPhoneQuery,
} from '../queries/impl';

/**
 * User Service - Orchestrates user-related operations
 *
 * This service provides a clean API for the presentation layer,
 * delegating to command and query handlers.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    // Command Handlers
    private readonly registerUserHandler: RegisterUserViaOAuthHandler,
    private readonly linkIdentityHandler: LinkIdentityHandler,
    private readonly completeOnboardingHandler: CompleteOnboardingHandler,
    private readonly updateProfileHandler: UpdateProfileHandler,
    private readonly updatePhoneNumberHandler: UpdatePhoneNumberHandler,
    private readonly updateSettingsHandler: UpdateSettingsHandler,

    // Query Handlers
    private readonly getUserByIdHandler: GetUserByIdHandler,
    private readonly getUserByEmailHandler: GetUserByEmailHandler,
    private readonly getUserByPhoneHandler: GetUserByPhoneHandler,
    private readonly getCurrentUserHandler: GetCurrentUserHandler,
  ) {}

  // ============================================================================
  // AUTHENTICATION & REGISTRATION
  // ============================================================================

  async registerViaOAuth(data: {
    provider: string;
    providerUserId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const command = new RegisterUserViaOAuthCommand(
      data.provider as any,
      data.providerUserId,
      data.email,
      data.firstName,
      data.lastName,
    );
    return await this.registerUserHandler.execute(command);
  }

  async linkIdentity(data: {
    userId: string;
    provider: string;
    providerUserId: string;
    email: string;
  }): Promise<User> {
    const command = new LinkIdentityCommand(
      data.userId,
      data.provider as any,
      data.providerUserId,
      data.email,
    );
    return await this.linkIdentityHandler.execute(command);
  }

  async completeOnboarding(userId: string): Promise<User> {
    const command = new CompleteOnboardingCommand(userId);
    return await this.completeOnboardingHandler.execute(command);
  }

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  async updateProfile(data: {
    userId: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    phoneNumber?: string;
    county?: string;
    physicalAddress?: string;
    postalAddress?: string;
  }): Promise<User> {
    const command = new UpdateProfileCommand(
      data.userId,
      data.firstName,
      data.lastName,
      data.avatarUrl,
      data.phoneNumber,
      data.county,
      data.physicalAddress,
      data.postalAddress,
    );
    return await this.updateProfileHandler.execute(command);
  }

  async updatePhoneNumber(userId: string, phoneNumber?: string): Promise<User> {
    const command = new UpdatePhoneNumberCommand(userId, phoneNumber);
    return await this.updatePhoneNumberHandler.execute(command);
  }

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  async updateSettings(data: {
    userId: string;
    language?: string;
    theme?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
    marketingOptIn?: boolean;
  }): Promise<User> {
    const command = new UpdateSettingsCommand(
      data.userId,
      data.language as any,
      data.theme as any,
      data.emailNotifications,
      data.smsNotifications,
      data.pushNotifications,
      data.marketingOptIn,
    );
    return await this.updateSettingsHandler.execute(command);
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  async getUserById(userId: string): Promise<User> {
    const query = new GetUserByIdQuery(userId);
    return await this.getUserByIdHandler.execute(query);
  }

  async getUserByEmail(email: string): Promise<User> {
    const query = new GetUserByEmailQuery(email);
    return await this.getUserByEmailHandler.execute(query);
  }

  async getUserByPhone(phoneNumber: string): Promise<User> {
    const query = new GetUserByPhoneQuery(phoneNumber);
    return await this.getUserByPhoneHandler.execute(query);
  }

  async getCurrentUser(userId: string): Promise<User> {
    const query = new GetCurrentUserQuery(userId);
    return await this.getCurrentUserHandler.execute(query);
  }

  // ============================================================================
  // BUSINESS LOGIC HELPERS
  // ============================================================================

  async checkOnboardingStatus(userId: string): Promise<{
    isComplete: boolean;
    needsOnboarding: boolean;
    hasProfile: boolean;
    hasSettings: boolean;
  }> {
    const user = await this.getUserById(userId);

    return {
      isComplete: user.hasCompletedOnboarding,
      needsOnboarding: user.needsOnboarding,
      hasProfile: !!user.profile,
      hasSettings: !!user.settings,
    };
  }

  async canReceiveNotifications(userId: string): Promise<{
    email: boolean;
    sms: boolean;
  }> {
    const user = await this.getUserById(userId);

    return {
      email: user.canReceiveEmail(),
      sms: user.canReceiveSms(),
    };
  }
}
