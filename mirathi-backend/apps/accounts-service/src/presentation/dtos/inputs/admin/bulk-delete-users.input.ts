// src/presentation/dtos/inputs/admin/bulk-delete-users.input.ts
import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

/**
 * Input for bulk deleting users
 */
@InputType()
export class BulkDeleteUsersInput {
  @Field(() => [ID])
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds: string[];
}
