import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class BusinessAssetDetailsDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  @IsNotEmpty()
  registrationNumber: string; // PVT/..., BN/...

  @IsString()
  @IsNotEmpty()
  @IsIn(['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LIMITED_COMPANY', 'LLP'])
  businessType: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  shareholdingPercentage: number;

  @IsNumber()
  @IsOptional()
  numberOfShares?: number;

  @IsString()
  @IsOptional()
  registeredAddress?: string;
}
