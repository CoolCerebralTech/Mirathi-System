import { IsString, IsEnum, IsOptional, IsNotEmpty, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class VerifyDocumentDto {
  @ApiProperty({ enum: [DocumentStatusEnum.VERIFIED, DocumentStatusEnum.REJECTED] })
  @IsEnum([DocumentStatusEnum.VERIFIED, DocumentStatusEnum.REJECTED])
  status: DocumentStatusEnum;

  @ApiPropertyOptional({
    description: 'Reason for rejection (required if status is REJECTED)',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Extracted document number during verification',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Data extracted from document during verification' })
  @IsObject()
  @IsOptional()
  extractedData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Verification metadata (checklist, notes, etc.)' })
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
