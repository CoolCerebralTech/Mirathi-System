// src/presentation/dtos/outputs/user-profile.output.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { KenyanCounty } from '@prisma/client';

import { PhoneNumberScalar } from '../../graphql/scalars';

/**
 * GraphQL output for UserProfile entity
 */
@ObjectType('UserProfile')
export class UserProfileOutput {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  fullName: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => PhoneNumberScalar, { nullable: true })
  phoneNumber?: string;

  @Field()
  phoneVerified: boolean;

  @Field(() => KenyanCounty, { nullable: true })
  county?: KenyanCounty;

  @Field({ nullable: true })
  physicalAddress?: string;

  @Field({ nullable: true })
  postalAddress?: string;

  @Field(() => Date)
  updatedAt: Date;
}
