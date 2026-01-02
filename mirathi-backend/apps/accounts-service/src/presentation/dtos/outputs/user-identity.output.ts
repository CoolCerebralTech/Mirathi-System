// src/presentation/dtos/outputs/user-identity.output.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AuthProvider } from '@prisma/client';

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
