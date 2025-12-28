import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

import { CoOwnershipType } from '../../../../../domain/enums/co-ownership-type.enum';

export class AddAssetCoOwnerDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  assetId: string;

  @IsUUID()
  @IsNotEmpty()
  familyMemberId: string; // Must link to Family Service

  @IsNumber()
  @Min(0.01)
  @Max(100)
  sharePercentage: number;

  @IsEnum(CoOwnershipType)
  ownershipType: CoOwnershipType; // JOINT_TENANCY vs TENANCY_IN_COMMON

  @IsUrl()
  @IsOptional()
  evidenceUrl?: string; // Proof of ownership

  @IsString()
  @IsNotEmpty()
  addedBy: string;
}
