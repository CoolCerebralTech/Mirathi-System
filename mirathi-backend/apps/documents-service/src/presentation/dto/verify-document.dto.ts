// apps/documents-service/src/presentation/dto/verify-document.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum VerificationAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class VerifyDocumentDto {
  @IsUUID()
  @IsNotEmpty()
  documentId: string;

  @IsEnum(VerificationAction)
  @IsNotEmpty()
  action: VerificationAction;

  @IsString()
  @IsOptional()
  notes?: string;
}
