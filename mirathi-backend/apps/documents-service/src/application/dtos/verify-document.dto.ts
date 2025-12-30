import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { DocumentStatusEnum } from '../../domain/value-objects/document-status.vo';

export class VerifyDocumentDto {
  @ApiProperty({ enum: [DocumentStatusEnum.VERIFIED, DocumentStatusEnum.REJECTED] })
  @IsEnum([DocumentStatusEnum.VERIFIED, DocumentStatusEnum.REJECTED])
  status: DocumentStatusEnum;

  @ApiPropertyOptional({
    description: "Reason for rejection. Required if status is 'REJECTED'.",
    maxLength: 1000,
  })
  @ValidateIf((o: VerifyDocumentDto) => o.status === DocumentStatusEnum.REJECTED)
  @IsNotEmpty({ message: 'Rejection reason must not be empty.' })
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Document number confirmed or extracted during verification',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({
    description:
      "Structured data extracted from the document during verification. This will update the document's metadata.",
  })
  @IsObject()
  @IsOptional()
  extractedData?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      'Additional metadata about the verification process itself (e.g., verifier checklist, notes). This is for the audit trail.',
  })
  @IsObject()
  @IsOptional()
  verificationMetadata?: Record<string, any>;
}

export class VerifyDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: DocumentStatusEnum })
  status: DocumentStatusEnum;

  @ApiProperty()
  verifiedBy: string;

  @ApiProperty()
  verifiedAt: Date;

  @ApiPropertyOptional()
  documentNumber?: string;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  verificationAttemptId?: string;

  constructor(partial: Partial<VerifyDocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
