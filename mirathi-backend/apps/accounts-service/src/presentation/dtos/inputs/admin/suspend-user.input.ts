// src/presentation/dtos/inputs/admin/suspend-user.input.ts
import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Input for suspending a user
 */
@InputType()
export class SuspendUserInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}
