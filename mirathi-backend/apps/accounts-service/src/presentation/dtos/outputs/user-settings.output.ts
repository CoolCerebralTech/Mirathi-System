import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Language, Theme } from '@prisma/client';

// ✅ REGISTER ENUMS HERE
registerEnumType(Language, {
  name: 'Language',
  description: 'Preferred language',
});

registerEnumType(Theme, {
  name: 'Theme',
  description: 'UI Theme preference',
});

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
