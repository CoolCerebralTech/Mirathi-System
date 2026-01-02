// src/presentation/dtos/inputs/user/update-profile.input.ts
import { Field, InputType } from '@nestjs/graphql';
import { KenyanCounty } from '@prisma/client';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

import { PhoneNumberScalar } from '../../../graphql/scalars';

/**
 * Input for updating user profile
 */
@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @Field(() => PhoneNumberScalar, { nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Field(() => KenyanCounty, { nullable: true })
  @IsOptional()
  county?: KenyanCounty;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  physicalAddress?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  postalAddress?: string;
}
