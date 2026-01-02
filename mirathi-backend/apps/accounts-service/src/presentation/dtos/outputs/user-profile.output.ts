import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { KenyanCounty } from '@prisma/client';

// ✅ Fix: Use String for the phone number to avoid circular dependency headaches
// The Scalar is great for Inputs, but for Outputs, String is safer in NestJS.
registerEnumType(KenyanCounty, { name: 'KenyanCounty', description: 'Counties' });

@ObjectType('UserProfile')
export class UserProfileOutput {
  @Field(() => ID)
  id: string;

  @Field(() => String) // ✅ Explicitly String
  firstName: string;

  @Field(() => String) // ✅ Explicitly String
  lastName: string;

  @Field(() => String) // ✅ Explicitly String
  fullName: string;

  @Field(() => String, { nullable: true }) // ✅ Explicitly String
  avatarUrl?: string;

  // ✅ Keep this as String for Output to solve the "CannotDetermineType" error permanently
  @Field(() => String, { nullable: true, description: 'E.164 format' })
  phoneNumber?: string;

  @Field()
  phoneVerified: boolean;

  @Field(() => KenyanCounty, { nullable: true })
  county?: KenyanCounty;

  @Field(() => String, { nullable: true }) // ✅ Explicitly String
  physicalAddress?: string;

  @Field(() => String, { nullable: true }) // ✅ Explicitly String
  postalAddress?: string;

  @Field(() => Date)
  updatedAt: Date;
}
