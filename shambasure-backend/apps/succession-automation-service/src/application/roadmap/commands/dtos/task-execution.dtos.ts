// src/succession-automation/src/application/roadmap/commands/dtos/task-execution.dtos.ts
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { ProofType } from '../../../../domain/entities/roadmap-task.entity';

/**
 * COMMAND: Start Task
 *
 * Locks the start time for efficiency tracking.
 */
export class StartTaskDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;
}

/**
 * COMMAND: Submit Task Proof
 *
 * The heavy lifter. Validates that the proof provided matches
 * what the task requires (Document, Receipt, Signature, etc.).
 */
export class SubmitTaskProofDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(ProofType)
  @IsNotEmpty()
  proofType: ProofType;

  /**
   * Required if proofType is DOCUMENT_UPLOAD.
   * Links to the Document Management System.
   */
  @ValidateIf((o) => o.proofType === ProofType.DOCUMENT_UPLOAD)
  @IsString()
  @IsNotEmpty()
  documentId?: string;

  /**
   * Required if proofType is COURT_RECEIPT or BANK_SLIP.
   */
  @ValidateIf((o) => [ProofType.COURT_RECEIPT, ProofType.BANK_SLIP].includes(o.proofType))
  @IsString()
  @IsNotEmpty()
  transactionReference?: string;

  /**
   * Flexible payload for digital signatures or other metadata.
   */
  @IsOptional()
  @IsObject()
  additionalMetadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

/**
 * COMMAND: Complete Task Manually
 *
 * Only allowed for tasks with `requiresProof: false`.
 */
export class CompleteTaskManuallyDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  completionNotes?: string;
}

/**
 * COMMAND: Skip Task
 *
 * requires a valid reason for the audit trail.
 */
export class SkipTaskDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

/**
 * COMMAND: Waive Task
 *
 * Used when a Court specifically allows bypassing a requirement.
 */
export class WaiveTaskDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string; // Typically a Legal Admin

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;

  /**
   * If waived by court order, this is mandatory for compliance.
   */
  @IsOptional()
  @IsString()
  courtOrderReference?: string;
}
