import { IsEnum, IsNotEmpty, IsString, IsUUID, IsUrl } from 'class-validator';

import { EvidenceType } from '../../../../../domain/enums/evidence-type.enum';

/**
 * Add Dependant Evidence DTO
 */
export class AddDependantEvidenceDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  dependantId: string;

  @IsEnum(EvidenceType)
  type: EvidenceType; // BIRTH_CERT, MARRIAGE_CERT, SCHOOL_FEES_RECEIPT

  @IsUrl()
  @IsNotEmpty()
  documentUrl: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  uploadedBy: string;
}

/**
 * Verify Dependant Evidence DTO
 *
 * Performed by the Executor or Legal Officer.
 */
export class VerifyDependantEvidenceDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  dependantId: string;

  @IsUUID()
  @IsNotEmpty()
  evidenceId: string;

  @IsString()
  @IsNotEmpty()
  verificationNotes: string; // e.g., "Checked against original"

  @IsString()
  @IsNotEmpty()
  verifiedBy: string;
}
