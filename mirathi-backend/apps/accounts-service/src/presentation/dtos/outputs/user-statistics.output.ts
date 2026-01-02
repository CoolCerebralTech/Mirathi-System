// src/presentation/dtos/outputs/user-statistics.output.ts
import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * Status count for statistics
 */
@ObjectType('StatusCount')
export class StatusCountOutput {
  @Field()
  status: string;

  @Field(() => Int)
  count: number;
}

/**
 * Role count for statistics
 */
@ObjectType('RoleCount')
export class RoleCountOutput {
  @Field()
  role: string;

  @Field(() => Int)
  count: number;
}

/**
 * GraphQL output for user statistics dashboard
 */
@ObjectType('UserStatistics')
export class UserStatisticsOutput {
  @Field(() => [StatusCountOutput])
  byStatus: StatusCountOutput[];

  @Field(() => [RoleCountOutput])
  byRole: RoleCountOutput[];

  @Field(() => Int)
  totalUsers: number;
}
