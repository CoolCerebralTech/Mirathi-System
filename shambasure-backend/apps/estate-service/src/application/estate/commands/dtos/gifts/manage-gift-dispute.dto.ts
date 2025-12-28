import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { GiftStatus } from '../../../../../domain/entities/gift-inter-vivos.entity';

/**
 * Contest Gift DTO
 *
 * Marks a gift as DISPUTED.
 */
export class ContestGiftDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  giftId: string;

  @IsString()
  @IsNotEmpty()
  reason: string; // e.g. "Recipient claims it was a loan"

  @IsString()
  @IsNotEmpty()
  contestedBy: string;
}

/**
 * Resolve Gift Dispute DTO
 *
 * Finalizes the status of a contested gift.
 */
export class ResolveGiftDisputeDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  giftId: string;

  @IsEnum(GiftStatus)
  outcome: GiftStatus; // CONFIRMED, EXCLUDED, VOID, RECLASSIFIED_AS_LOAN

  @IsString()
  @IsNotEmpty()
  resolutionDetails: string;

  @IsString()
  @IsOptional()
  courtOrderReference?: string;

  @IsString()
  @IsNotEmpty()
  resolvedBy: string;
}
