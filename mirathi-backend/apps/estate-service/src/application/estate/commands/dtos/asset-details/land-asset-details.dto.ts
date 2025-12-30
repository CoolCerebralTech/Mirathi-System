import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class LandAssetDetailsDto {
  @IsString()
  @IsNotEmpty()
  titleDeedNumber: string;

  @IsString()
  @IsNotEmpty()
  // Kenyan LR Format often varies (e.g., "Nairobi/Block123/456"), strict regex is hard, but we ensure presence.
  landReferenceNumber: string;

  @IsString()
  @IsNotEmpty()
  county: string; // Will be validated against KenyanCountyVO in domain

  @IsString()
  @IsOptional()
  subCounty?: string;

  @IsString()
  @IsOptional()
  locationDescription?: string;

  @IsNumber()
  @Min(0.01, { message: 'Acreage must be positive' })
  acreage: number;

  @IsString()
  @IsNotEmpty()
  landUse: string; // RESIDENTIAL, AGRICULTURAL, COMMERCIAL

  @IsString()
  @IsNotEmpty()
  registeredOwner: string; // Should match Deceased Name usually, or Co-owner
}
