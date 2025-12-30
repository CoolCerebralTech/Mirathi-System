// src/succession-automation/src/presentation/roadmap/dtos/request/task-execution.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateIf } from 'class-validator';

import { ProofType } from '../../../../domain/entities/roadmap-task.entity';

export class SubmitTaskProofRequestDto {
  @ApiProperty({
    description: 'The type of proof being submitted',
    enum: ProofType,
    example: ProofType.DOCUMENT_UPLOAD,
  })
  @IsEnum(ProofType)
  @IsNotEmpty()
  proofType: ProofType;

  @ApiPropertyOptional({
    description: 'ID of the uploaded document (Required if proofType is DOCUMENT_UPLOAD)',
    example: 'doc-uuid-123',
  })
  @ValidateIf((o) => o.proofType === ProofType.DOCUMENT_UPLOAD)
  @IsString()
  @IsNotEmpty()
  documentId?: string;

  @ApiPropertyOptional({
    description: 'Transaction reference (Required for payments)',
    example: 'QWE123RTY45',
  })
  @ValidateIf((o) => [ProofType.COURT_RECEIPT, ProofType.BANK_SLIP].includes(o.proofType))
  @IsString()
  @IsNotEmpty()
  transactionReference?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for digital signatures or custom proofs',
    example: { signedAt: '2025-01-01T10:00:00Z', provider: 'DocuSign' },
  })
  @IsOptional()
  @IsObject()
  additionalMetadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'User notes or context regarding the completion',
    example: 'Filed at the Milimani registry counter 4.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SkipTaskRequestDto {
  @ApiProperty({
    description: 'Reason for skipping the task',
    example: 'Not applicable - Deceased had no bank accounts',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class WaiveTaskRequestDto {
  @ApiProperty({
    description: 'Reason for the waiver',
    example: 'Court order exempted this requirement due to urgency',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Reference number of the court order granting the waiver',
    example: 'HC/MISC/123/2025',
  })
  @IsOptional()
  @IsString()
  courtOrderReference?: string;
}

export class EscalateTaskRequestDto {
  @ApiProperty({
    description: 'Category of the issue',
    enum: ['LEGAL_CLARIFICATION', 'COURT_DELAY', 'FAMILY_DISPUTE', 'DOCUMENT_UNOBTAINABLE'],
    example: 'COURT_DELAY',
  })
  @IsEnum(['LEGAL_CLARIFICATION', 'COURT_DELAY', 'FAMILY_DISPUTE', 'DOCUMENT_UNOBTAINABLE'])
  @IsNotEmpty()
  reasonCategory: string;

  @ApiProperty({
    description: 'Detailed description of the problem',
    example:
      'Registry clerk refused to accept the P&A 5 form without the original death certificate, which is lost.',
  })
  @IsString()
  @IsNotEmpty()
  userNotes: string;
}
