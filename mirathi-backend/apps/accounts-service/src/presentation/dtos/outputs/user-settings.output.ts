// src/presentation/dtos/outputs/user-settings.output.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Language, Theme } from '@prisma/client';

/**
 * GraphQL output for UserSettings entity
 */
@ObjectType('UserSettings')
export class UserSettingsOutput {
  @Field(() => ID)
  id: string;

  @Field(() => Language)
  language: Language;

  @Field(() => Theme)
  theme: Theme;

  @Field()
  emailNotifications: boolean;

  @Field()
  smsNotifications: boolean;

  @Field()
  pushNotifications: boolean;

  @Field()
  marketingOptIn: boolean;

  @Field(() => Date)
  updatedAt: Date;
}
