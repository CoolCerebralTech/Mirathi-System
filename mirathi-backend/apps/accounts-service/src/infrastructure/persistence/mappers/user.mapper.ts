// src/infrastructure/persistence/mappers/user.mapper.ts
import { Injectable } from '@nestjs/common';
import { AccountStatus, UserRole } from '@prisma/client';

import { User } from '../../../domain/aggregates/user.aggregate';
import { UserIdentity } from '../../../domain/entities/user-identity.entity';
import { UserProfile } from '../../../domain/entities/user-profile.entity';
import { UserSettings } from '../../../domain/entities/user-settings.entity';

/**
 * Persistence models based on Prisma schema
 */
export interface PrismaUserModel {
  id: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  identities: PrismaUserIdentityModel[];
  profile: PrismaUserProfileModel | null;
  settings: PrismaUserSettingsModel | null;
}

export interface PrismaUserIdentityModel {
  id: string;
  provider: string; // Enum stored as string or Prisma Enum
  providerUserId: string;
  email: string;
  isPrimary: boolean;
  linkedAt: Date;
  lastUsedAt: Date;
}

export interface PrismaUserProfileModel {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  county: string | null;
  physicalAddress: string | null;
  postalAddress: string | null;
  updatedAt: Date;
}

export interface PrismaUserSettingsModel {
  id: string;
  userId: string;
  language: string;
  theme: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingOptIn: boolean;
  updatedAt: Date;
}

/**
 * Return type for the toPersistence method
 */
export interface UserPersistenceData {
  userData: Omit<PrismaUserModel, 'identities' | 'profile' | 'settings'>;
  identitiesData: PrismaUserIdentityModel[];
  profileData: PrismaUserProfileModel | null;
  settingsData: PrismaUserSettingsModel | null;
}

@Injectable()
export class UserMapper {
  /**
   * Map Prisma model to Domain Aggregate
   */
  toDomain(prismaUser: PrismaUserModel): User {
    // Map identities
    const identities = prismaUser.identities.map((identity) =>
      UserIdentity.fromPersistence({
        id: identity.id,
        provider: identity.provider as any, // Cast to Domain Enum
        providerUserId: identity.providerUserId,
        email: identity.email,
        isPrimary: identity.isPrimary,
        linkedAt: identity.linkedAt,
        lastUsedAt: identity.lastUsedAt,
      }),
    );

    // Map profile if exists
    const profile = prismaUser.profile
      ? UserProfile.fromPersistence({
          id: prismaUser.profile.id,
          userId: prismaUser.profile.userId,
          firstName: prismaUser.profile.firstName,
          lastName: prismaUser.profile.lastName,
          avatarUrl: prismaUser.profile.avatarUrl || undefined,
          phoneNumber: prismaUser.profile.phoneNumber || undefined,
          phoneVerified: prismaUser.profile.phoneVerified,
          county: prismaUser.profile.county || undefined,
          physicalAddress: prismaUser.profile.physicalAddress || undefined,
          postalAddress: prismaUser.profile.postalAddress || undefined,
          updatedAt: prismaUser.profile.updatedAt,
        })
      : undefined;

    // Map settings if exists
    const settings = prismaUser.settings
      ? UserSettings.fromPersistence({
          id: prismaUser.settings.id,
          userId: prismaUser.settings.userId,
          language: prismaUser.settings.language as any,
          theme: prismaUser.settings.theme as any,
          emailNotifications: prismaUser.settings.emailNotifications,
          smsNotifications: prismaUser.settings.smsNotifications,
          pushNotifications: prismaUser.settings.pushNotifications,
          marketingOptIn: prismaUser.settings.marketingOptIn,
          updatedAt: prismaUser.settings.updatedAt,
        })
      : undefined;

    return User.fromPersistence({
      id: prismaUser.id,
      role: prismaUser.role,
      status: prismaUser.status,
      identities,
      profile,
      settings,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: prismaUser.deletedAt || undefined,
    });
  }

  /**
   * Map Domain Aggregate to Prisma create/update data
   * FIX: Replaced 'any' with explicit interfaces defined above.
   */
  toPersistence(user: User): UserPersistenceData {
    const userData: Omit<PrismaUserModel, 'identities' | 'profile' | 'settings'> = {
      id: user.id,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.value,
      updatedAt: user.updatedAt.value,
      deletedAt: user.deletedAt?.value || null,
    };

    const identitiesData: PrismaUserIdentityModel[] = user.identities.map((identity) => ({
      id: identity.id,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      email: identity.email,
      isPrimary: identity.isPrimary,
      linkedAt: identity.linkedAt.value,
      lastUsedAt: identity.lastUsedAt.value,
    }));

    const profileData: PrismaUserProfileModel | null = user.profile
      ? {
          id: user.profile.id,
          userId: user.profile.userId,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          avatarUrl: user.profile.avatarUrl || null,
          phoneNumber: user.profile.phoneNumber?.value || null,
          phoneVerified: user.profile.phoneVerified,
          county: user.profile.county?.value || null,
          physicalAddress: user.profile.physicalAddress || null,
          postalAddress: user.profile.postalAddress || null,
          updatedAt: user.profile.updatedAt.value,
        }
      : null;

    const settingsData: PrismaUserSettingsModel | null = user.settings
      ? {
          id: user.settings.id,
          userId: user.settings.userId,
          language: user.settings.language,
          theme: user.settings.theme,
          emailNotifications: user.settings.emailNotifications,
          smsNotifications: user.settings.smsNotifications,
          pushNotifications: user.settings.pushNotifications,
          marketingOptIn: user.settings.marketingOptIn,
          updatedAt: user.settings.updatedAt.value,
        }
      : null;

    return {
      userData,
      identitiesData,
      profileData,
      settingsData,
    };
  }

  /**
   * Map partial profile update data
   * Using Partial<PrismaUserProfileModel> for better type safety
   */
  toProfileUpdateData(profile: UserProfile): Partial<PrismaUserProfileModel> {
    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl || null,
      phoneNumber: profile.phoneNumber?.value || null,
      phoneVerified: profile.phoneVerified,
      county: profile.county?.value || null,
      physicalAddress: profile.physicalAddress || null,
      postalAddress: profile.postalAddress || null,
      updatedAt: profile.updatedAt.value,
    };
  }

  /**
   * Map partial settings update data
   * Using Partial<PrismaUserSettingsModel> for better type safety
   */
  toSettingsUpdateData(settings: UserSettings): Partial<PrismaUserSettingsModel> {
    return {
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
