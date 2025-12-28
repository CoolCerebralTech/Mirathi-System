import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

// Defined inline or imported if you prefer shared enums for presentation
export enum RevocationMethod {
  NEW_WILL = 'NEW_WILL',
  CODICIL = 'CODICIL',
  DESTRUCTION = 'DESTRUCTION',
  COURT_ORDER = 'COURT_ORDER',
  MARRIAGE = 'MARRIAGE',
  DIVORCE = 'DIVORCE',
  OTHER = 'OTHER',
}

export class RevokeWillRequestDto {
  @ApiProperty({ enum: RevocationMethod, description: 'Legal method of revocation' })
  @IsEnum(RevocationMethod)
  method: RevocationMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
