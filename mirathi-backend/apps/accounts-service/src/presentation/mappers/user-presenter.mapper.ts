// src/presentation/mappers/user-presenter.mapper.ts
import { Injectable } from '@nestjs/common';

import { User } from '../../domain/aggregates/user.aggregate';
import { UserOutput } from '../dtos/outputs';
import { UserIdentityPresenterMapper } from './user-identity-presenter.mapper';
import { UserProfilePresenterMapper } from './user-profile-presenter.mapper';
import { UserSettingsPresenterMapper } from './user-settings-presenter.mapper';

/**
 * Maps User aggregate to GraphQL output
 *
 * This is the main mapper that orchestrates all entity mappers.
 */
@Injectable()
export class UserPresenterMapper {
  constructor(
    private readonly identityMapper: UserIdentityPresenterMapper,
    private readonly profileMapper: UserProfilePresenterMapper,
    private readonly settingsMapper: UserSettingsPresenterMapper,
  ) {}

  /**
   * Convert User aggregate to GraphQL output
   */
  toOutput(user: User): UserOutput {
    return {
      id: user.id,
      role: user.role,
      status: user.status,
      identities: this.identityMapper.toOutputList(user.identities),
      profile: user.profile ? this.profileMapper.toOutput(user.profile) : undefined,
      settings: user.settings ? this.settingsMapper.toOutput(user.settings) : undefined,
      createdAt: user.createdAt.value,
      updatedAt: user.updatedAt.value,
      deletedAt: user.deletedAt?.value,

      // Computed fields from domain aggregate
      displayName: user.displayName,
      isActive: user.isActive,
      isSuspended: user.isSuspended,
      isDeleted: user.isDeleted,
      isPendingOnboarding: user.isPendingOnboarding,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      needsOnboarding: user.needsOnboarding,
    };
  }

  /**
   * Convert list of users
   */
  toOutputList(users: User[]): UserOutput[] {
    return users.map((user) => this.toOutput(user));
  }
}
