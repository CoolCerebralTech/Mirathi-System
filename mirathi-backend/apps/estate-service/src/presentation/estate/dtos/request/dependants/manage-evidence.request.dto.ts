import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';

import { EvidenceType } from '../../../../../domain/enums/evidence-type.enum';

export class AddDependantEvidenceRequestDto {
  @ApiProperty({ enum: EvidenceType })
  @IsEnum(EvidenceType)
  type: EvidenceType;

  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  documentUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class VerifyDependantEvidenceRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  verificationNotes: string;
}
