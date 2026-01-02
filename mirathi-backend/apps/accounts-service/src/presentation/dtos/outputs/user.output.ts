// src/presentation/dtos/outputs/user.output.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AccountStatus, UserRole } from '@prisma/client';

import { UserIdentityOutput } from './user-identity.output';
import { UserProfileOutput } from './user-profile.output';
import { UserSettingsOutput } from './user-settings.output';

/**
 * Main GraphQL output for User aggregate
 */
@ObjectType('User')
export class UserOutput {
  @Field(() => ID)
  id: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => AccountStatus)
  status: AccountStatus;

  @Field(() => [UserIdentityOutput])
  identities: UserIdentityOutput[];

  @Field(() => UserProfileOutput, { nullable: true })
  profile?: UserProfileOutput;

  @Field(() => UserSettingsOutput, { nullable: true })
  settings?: UserSettingsOutput;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date;

  // Computed fields (from domain aggregate)
  @Field()
  displayName: string;

  @Field()
  isActive: boolean;

  @Field()
  isSuspended: boolean;

  @Field()
  isDeleted: boolean;

  @Field()
  isPendingOnboarding: boolean;

  @Field()
  hasCompletedOnboarding: boolean;

  @Field()
  needsOnboarding: boolean;
}
