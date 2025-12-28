import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * Submit For Approval DTO
 * Used when the Liquidation Type requires Court/Beneficiary consent.
 */
export class SubmitLiquidationForApprovalDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  liquidationId: string;

  @IsString()
  @IsNotEmpty()
  submittedBy: string;
}

/**
 * Approve Liquidation DTO
 * Records the formal permission to proceed with sale.
 *
 * LEGAL CONTEXT:
 * - Court Order is required for selling land involving minors.
 */
export class ApproveLiquidationDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  liquidationId: string;

  @IsString()
  @IsNotEmpty()
  courtOrderReference: string; // Critical for audit trail

  @IsString()
  @IsNotEmpty()
  approvedBy: string; // User ID of the recording officer
}
