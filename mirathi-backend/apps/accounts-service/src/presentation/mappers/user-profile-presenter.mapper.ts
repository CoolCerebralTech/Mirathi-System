// src/presentation/mappers/user-profile-presenter.mapper.ts
import { Injectable } from '@nestjs/common';

import { UserProfile } from '../../domain/entities';
import { UserProfileOutput } from '../dtos/outputs';

/**
 * Maps UserProfile entity to GraphQL output
 */
@Injectable()
export class UserProfilePresenterMapper {
  toOutput(profile: UserProfile): UserProfileOutput {
    return {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      phoneNumber: profile.phoneNumber?.value,
      phoneVerified: profile.phoneVerified,
      county: profile.county?.value as any,
      physicalAddress: profile.physicalAddress,
      postalAddress: profile.postalAddress,
      updatedAt: profile.updatedAt.value,
    };
  }
}
