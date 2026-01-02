// src/presentation/dtos/inputs/user/update-phone.input.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

import { PhoneNumberScalar } from '../../../graphql/scalars';

/**
 * Input for updating phone number
 */
@InputType()
export class UpdatePhoneInput {
  @Field(() => PhoneNumberScalar, { nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
