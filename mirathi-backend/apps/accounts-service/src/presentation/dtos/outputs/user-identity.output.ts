import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { AuthProvider } from '@prisma/client';

// ✅ REGISTER THE ENUM HERE
registerEnumType(AuthProvider, {
  name: 'AuthProvider',
  description: 'Authentication provider (Google, etc.)',
});

/**
 * GraphQL output for UserIdentity entity
 */
@ObjectType('UserIdentity')
export class UserIdentityOutput {
  @Field(() => ID)
  id: string;

  @Field(() => AuthProvider)
  provider: AuthProvider;

  @Field()
  email: string;

  @Field()
  isPrimary: boolean;

  @Field(() => Date)
  linkedAt: Date;

  @Field(() => Date)
  lastUsedAt: Date;
}
