// src/presentation/dtos/outputs/bulk-operation-result.output.ts
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL output for bulk operations (suspend, delete)
 */
@ObjectType('BulkOperationResult')
export class BulkOperationResultOutput {
  @Field(() => [ID])
  succeeded: string[];

  @Field(() => [ID])
  failed: string[];

  @Field(() => Int)
  totalSucceeded: number;

  @Field(() => Int)
  totalFailed: number;
}
