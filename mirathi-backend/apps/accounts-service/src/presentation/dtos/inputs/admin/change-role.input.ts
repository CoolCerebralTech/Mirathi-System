// src/presentation/dtos/inputs/admin/change-role.input.ts
import { Field, ID, InputType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Input for changing user role
 */
@InputType()
export class ChangeRoleInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  newRole: UserRole;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}
