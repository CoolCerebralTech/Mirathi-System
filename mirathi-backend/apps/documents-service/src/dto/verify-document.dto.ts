import { DocumentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyDocumentDto {
  @IsEnum(DocumentStatus)
  @IsNotEmpty()
  status: DocumentStatus; // Send 'VERIFIED' or 'REJECTED'

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
