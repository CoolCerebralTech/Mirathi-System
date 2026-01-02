// src/presentation/dtos/inputs/auth/oauth-callback.input.ts
import { Field, InputType } from '@nestjs/graphql';
import { AuthProvider } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';

/**
 * Input for OAuth callback handler
 */
@InputType()
export class OAuthCallbackInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  code: string;

  @Field()
  @IsNotEmpty()
  @IsUrl()
  redirectUri: string;

  @Field(() => AuthProvider)
  @IsEnum(AuthProvider)
  provider: AuthProvider;
}
