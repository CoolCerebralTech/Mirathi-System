// src/2_application/dtos/verify-document.dto.ts
import { IsString, IsEnum, IsOptional, IsNotEmpty, IsObject, MaxLength } from 'class-validator';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class VerifyDocumentDto {
  @IsEnum([DocumentStatusEnum.VERIFIED, DocumentStatusEnum.REJECTED])
  status: DocumentStatusEnum;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  documentNumber?: string;

  @IsObject()
  @IsOptional()
  extractedData?: Record<string, any>;

  @IsObject()
  @IsOptional()
  verificationMetadata?: Record<string, any>;
}

export class VerifyDocumentResponseDto {
  id: string;
  status: DocumentStatusEnum;
  verifiedBy: string;
  verifiedAt: Date;
  documentNumber?: string;
  rejectionReason?: string;

  constructor(partial: Partial<VerifyDocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
