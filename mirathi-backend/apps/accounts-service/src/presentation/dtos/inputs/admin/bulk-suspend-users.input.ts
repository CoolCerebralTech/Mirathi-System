// src/presentation/dtos/inputs/admin/bulk-suspend-users.input.ts
import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Input for bulk suspending users
 */
@InputType()
export class BulkSuspendUsersInput {
  @Field(() => [ID])
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}
