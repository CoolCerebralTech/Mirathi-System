import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class VerifyMemberIdentityDto {
  @ApiProperty()
  @IsBoolean()
  isValid: boolean;

  @ApiProperty({ enum: ['IPRS_CHECK', 'MANUAL_DOCUMENT_REVIEW', 'TRUSTED_AGENT'] })
  @IsEnum(['IPRS_CHECK', 'MANUAL_DOCUMENT_REVIEW', 'TRUSTED_AGENT'])
  verificationMethod: 'IPRS_CHECK' | 'MANUAL_DOCUMENT_REVIEW' | 'TRUSTED_AGENT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'If the ID number was previously wrong/missing' })
  @IsOptional()
  @IsString()
  correctedNationalId?: string;
}
