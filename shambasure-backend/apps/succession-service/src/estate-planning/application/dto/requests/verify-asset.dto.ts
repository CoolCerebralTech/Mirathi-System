import { AssetVerificationStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class VerifyAssetDto {
  @IsEnum(AssetVerificationStatus)
  verificationStatus: AssetVerificationStatus;

  @IsString()
  @IsNotEmpty()
  verifiedByUserId: string;
}
