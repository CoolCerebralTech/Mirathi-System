import { WillStorageLocation, WillType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FuneralWishesDto {
  @IsString()
  @IsOptional()
  burialLocation?: string;

  @IsString()
  @IsOptional()
  funeralType?: string;

  @IsString()
  @IsOptional()
  specificInstructions?: string;

  @IsString()
  @IsOptional()
  preferredOfficiant?: string;

  @IsString({ each: true })
  @IsOptional()
  traditionalRites?: string[];

  @IsString()
  @IsOptional()
  clanInvolvement?: string;
}

export class DigitalAssetInstructionsDto {
  @IsString()
  @IsOptional()
  socialMediaHandling?: string;

  @IsString()
  @IsOptional()
  emailAccountHandling?: string;

  @IsString()
  @IsOptional()
  cryptocurrencyInstructions?: string;

  @IsString()
  @IsOptional()
  onlineAccountClosure?: string;

  @IsString({ each: true })
  @IsOptional()
  digitalLegacyContacts?: string[];
}

export class LegalCapacityAssessmentDto {
  @IsBoolean()
  isOfAge: boolean;

  @IsBoolean()
  isSoundMind: boolean;

  @IsBoolean()
  understandsWillNature: boolean;

  @IsBoolean()
  understandsAssetExtent: boolean;

  @IsBoolean()
  understandsBeneficiaryClaims: boolean;

  @IsBoolean()
  freeFromUndueInfluence: boolean;

  @IsDate()
  @Type(() => Date)
  assessmentDate: Date;

  @IsString()
  @IsOptional()
  assessedBy?: string;

  @IsString()
  @IsOptional()
  medicalCertificationId?: string;

  @IsString()
  @IsOptional()
  assessmentNotes?: string;
}

export class CreateWillDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(WillType)
  type: WillType = WillType.STANDARD;

  @IsBoolean()
  @IsOptional()
  isHolographic?: boolean = false;

  @IsBoolean()
  @IsOptional()
  requiresWitnesses?: boolean = true;

  // Funeral and burial wishes
  @ValidateNested()
  @Type(() => FuneralWishesDto)
  @IsOptional()
  funeralWishes?: FuneralWishesDto;

  @IsString()
  @IsOptional()
  burialLocation?: string;

  @IsString()
  @IsOptional()
  cremationInstructions?: string;

  @IsBoolean()
  @IsOptional()
  organDonation?: boolean = false;

  @IsString()
  @IsOptional()
  organDonationDetails?: string;

  // Estate distribution
  @IsString()
  @IsOptional()
  residuaryClause?: string;

  @ValidateNested()
  @Type(() => DigitalAssetInstructionsDto)
  @IsOptional()
  digitalAssetInstructions?: DigitalAssetInstructionsDto;

  @IsString()
  @IsOptional()
  specialInstructions?: string;

  // Storage
  @IsEnum(WillStorageLocation)
  @IsOptional()
  storageLocation?: WillStorageLocation;

  @IsString()
  @IsOptional()
  storageDetails?: string;

  // Dependant provision
  @IsBoolean()
  @IsOptional()
  hasDependantProvision?: boolean = false;

  @IsString()
  @IsOptional()
  dependantProvisionDetails?: string;
}
