import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { SignatureType } from '../../../../domain/entities/generated-form.entity';

// 1. Generate Bundle
export class GenerateFormsRequestDto {
  @ApiPropertyOptional({
    description: 'If true, overwrites existing DRAFT forms. Use with caution.',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  forceRegeneration?: boolean;
}

// 2. Regenerate (Context Change)
export class RegenerateFormsRequestDto {
  @ApiProperty({ example: 'Will discovered after initial filing' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// 3. Review Form
export class ReviewFormRequestDto {
  @ApiPropertyOptional({ example: 'Spelling of name on page 2 looks incorrect' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Approve the form content', default: true })
  @IsBoolean()
  approved: boolean;
}

// 4. Sign Form
export class SignFormRequestDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  signatoryName: string;

  @ApiProperty({
    enum: SignatureType,
    example: SignatureType.DIGITAL_SIGNATURE,
  })
  @IsEnum(SignatureType)
  signatureType: SignatureType;

  @ApiPropertyOptional({ description: 'ID from DocuSign/AdobeSign if external' })
  @IsString()
  @IsOptional()
  digitalSignatureId?: string;
}

// 5. Amend Form (Fix Rejection)
export class AmendFormRequestDto {
  @ApiProperty({ description: 'S3 URL of the fixed document' })
  @IsString()
  @IsNotEmpty()
  newStorageUrl: string;

  @ApiProperty({ description: 'SHA-256 Checksum of new file' })
  @IsString()
  @IsNotEmpty()
  checksum: string;

  @ApiProperty({ example: 'Corrected typo in deceased name per court query' })
  @IsString()
  @IsNotEmpty()
  changesDescription: string;
}
