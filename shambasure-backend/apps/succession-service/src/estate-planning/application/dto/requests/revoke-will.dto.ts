import { RevocationMethod } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class RevokeWillDto {
  @IsString()
  @IsNotEmpty()
  revokedBy: string;

  @IsString()
  @IsNotEmpty()
  revocationReason: string;

  @IsEnum(RevocationMethod)
  revocationMethod: RevocationMethod;
}
