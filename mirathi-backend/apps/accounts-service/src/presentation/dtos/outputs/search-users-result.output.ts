// src/presentation/dtos/outputs/search-users-result.output.ts
import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UserOutput } from './user.output';

/**
 * GraphQL output for user search results
 */
@ObjectType('SearchUsersResult')
export class SearchUsersResultOutput {
  @Field(() => [UserOutput])
  users: UserOutput[];

  @Field(() => Int)
  total: number;
}
