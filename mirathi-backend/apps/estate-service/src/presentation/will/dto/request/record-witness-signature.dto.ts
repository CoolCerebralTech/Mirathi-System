import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import type { SignatureType } from '../../../../domain/entities/will-witness.entity';

export class RecordWitnessSignatureRequestDto {
  @ApiProperty()
  @IsUUID()
  witnessId: string;

  @ApiProperty({
    enum: [
      'DIGITAL_SIGNATURE',
      'WET_SIGNATURE',
      'E_SIGNATURE',
      'BIOMETRIC_SIGNATURE',
      'WITNESS_MARK',
    ],
  })
  @IsEnum([
    'DIGITAL_SIGNATURE',
    'WET_SIGNATURE',
    'E_SIGNATURE',
    'BIOMETRIC_SIGNATURE',
    'WITNESS_MARK',
  ])
  signatureType: SignatureType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
