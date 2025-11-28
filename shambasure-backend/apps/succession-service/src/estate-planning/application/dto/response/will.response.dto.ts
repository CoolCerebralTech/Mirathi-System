import { WillStatus } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

import { AssetResponseDto } from './asset.response.dto';
import { BeneficiaryResponseDto } from './beneficiary.response.dto';
import { ExecutorResponseDto } from './executor.response.dto';
import { WitnessResponseDto } from './witness.response.dto';

@Exclude()
export class WillClauseResponse {
  @Expose() burialLocation?: string;
  @Expose() funeralType?: string;
  @Expose() specificInstructions?: string;
}

@Exclude()
export class WillResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  status: WillStatus;

  @Expose()
  versionNumber: number;

  @Expose()
  lastModified: Date;

  // Clauses
  @Expose()
  @Type(() => WillClauseResponse)
  funeralWishes?: WillClauseResponse;

  @Expose()
  residuaryClause?: string;

  @Expose()
  specialInstructions?: string;

  // Relationships
  // We include these so the frontend gets the full state in one call
  @Expose()
  @Type(() => AssetResponseDto)
  assets: AssetResponseDto[];

  @Expose()
  @Type(() => BeneficiaryResponseDto)
  beneficiaries: BeneficiaryResponseDto[];

  @Expose()
  @Type(() => ExecutorResponseDto)
  executors: ExecutorResponseDto[];

  @Expose()
  @Type(() => WitnessResponseDto)
  witnesses: WitnessResponseDto[];

  // Computed Status Helpers
  @Expose()
  requiresWitnesses: boolean;

  @Expose()
  witnessCount: number;

  @Expose()
  isReadyForActivation: boolean;
}
