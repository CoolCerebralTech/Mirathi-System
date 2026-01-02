// src/application/services/user.service.ts
import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthProvider, Language, Theme } from '@prisma/client';

import { User } from '../../domain/aggregates/user.aggregate';
// Commands
import {
  CompleteOnboardingCommand,
  LinkIdentityCommand,
  RegisterUserViaOAuthCommand,
} from '../commands/impl/auth';
import { UpdatePhoneNumberCommand, UpdateProfileCommand } from '../commands/impl/profile';
import { UpdateSettingsCommand } from '../commands/impl/settings';
// Queries
import {
  GetCurrentUserQuery,
  GetUserByEmailQuery,
  GetUserByIdQuery,
  GetUserByPhoneQuery,
} from '../queries/impl';

/**
 * User Service - Orchestrates user-related operations
 *
 * UPGRADE NOTE: Now uses CommandBus and QueryBus for true CQRS decoupling.
 */
@Injectable()
export class UserService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
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
    return this.commandBus.execute(
      new RegisterUserViaOAuthCommand(
        data.provider as AuthProvider, // Strict cast
        data.providerUserId,
        data.email,
        data.firstName,
        data.lastName,
      ),
    );
  }

  async linkIdentity(data: {
    userId: string;
    provider: string;
    providerUserId: string;
    email: string;
  }): Promise<User> {
    return this.commandBus.execute(
      new LinkIdentityCommand(
        data.userId,
        data.provider as AuthProvider,
        data.providerUserId,
        data.email,
      ),
    );
  }

  async completeOnboarding(userId: string): Promise<User> {
    return this.commandBus.execute(new CompleteOnboardingCommand(userId));
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
    return this.commandBus.execute(
      new UpdateProfileCommand(
        data.userId,
        data.firstName,
        data.lastName,
        data.avatarUrl,
        data.phoneNumber,
        data.county,
        data.physicalAddress,
        data.postalAddress,
      ),
    );
  }

  async updatePhoneNumber(userId: string, phoneNumber?: string): Promise<User> {
    return this.commandBus.execute(new UpdatePhoneNumberCommand(userId, phoneNumber));
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
    return this.commandBus.execute(
      new UpdateSettingsCommand(
        data.userId,
        data.language as Language,
        data.theme as Theme,
        data.emailNotifications,
        data.smsNotifications,
        data.pushNotifications,
        data.marketingOptIn,
      ),
    );
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  async getUserById(userId: string): Promise<User> {
    return this.queryBus.execute(new GetUserByIdQuery(userId));
  }

  async getUserByEmail(email: string): Promise<User> {
    return this.queryBus.execute(new GetUserByEmailQuery(email));
  }

  async getUserByPhone(phoneNumber: string): Promise<User> {
    return this.queryBus.execute(new GetUserByPhoneQuery(phoneNumber));
  }

  async getCurrentUser(userId: string): Promise<User> {
    return this.queryBus.execute(new GetCurrentUserQuery(userId));
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
    // Reuse the Query Bus
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));

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
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));

    return {
      email: user.canReceiveEmail(),
      sms: user.canReceiveSms(),
    };
  }
}
