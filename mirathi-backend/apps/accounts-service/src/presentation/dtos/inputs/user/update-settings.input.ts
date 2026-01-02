// src/presentation/dtos/inputs/user/update-settings.input.ts
import { Field, InputType } from '@nestjs/graphql';
import { Language, Theme } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

/**
 * Input for updating user settings
 */
@InputType()
export class UpdateSettingsInput {
  @Field(() => Language, { nullable: true })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @Field(() => Theme, { nullable: true })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
