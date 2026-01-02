// src/presentation/dtos/outputs/auth-response.output.ts
import { Field, ObjectType } from '@nestjs/graphql';

import { UserOutput } from './user.output';

/**
 * GraphQL output for OAuth callback response
 */
@ObjectType('AuthResponse')
export class AuthResponseOutput {
  @Field(() => UserOutput)
  user: UserOutput;

  @Field()
  isNewUser: boolean;

  @Field({ nullable: true })
  message?: string;
}
