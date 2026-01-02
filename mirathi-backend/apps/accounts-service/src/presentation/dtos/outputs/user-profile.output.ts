import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { KenyanCounty } from '@prisma/client';

// ✅ REGISTER THE ENUM HERE
registerEnumType(KenyanCounty, {
  name: 'KenyanCounty',
  description: 'List of counties in Kenya',
});

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

  @Field(() => String, { nullable: true, description: 'Kenyan phone number in E.164 format' })
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
