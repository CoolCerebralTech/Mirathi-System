// src/presentation/dtos/outputs/paginated-users.output.ts
import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UserOutput } from './user.output';

/**
 * GraphQL output for paginated user list
 */
@ObjectType('PaginatedUsers')
export class PaginatedUsersOutput {
  @Field(() => [UserOutput])
  users: UserOutput[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}
