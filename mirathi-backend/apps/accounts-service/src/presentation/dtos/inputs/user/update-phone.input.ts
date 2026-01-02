// src/presentation/dtos/inputs/user/update-phone.input.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Input for updating phone number
 */
@InputType()
export class UpdatePhoneInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;
}
