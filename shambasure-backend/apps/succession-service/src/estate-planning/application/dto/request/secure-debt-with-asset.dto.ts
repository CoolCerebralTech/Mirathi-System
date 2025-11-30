import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SecureDebtWithAssetDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  securityDetails: string;

  @IsString()
  @IsOptional()
  collateralDescription?: string;
}
