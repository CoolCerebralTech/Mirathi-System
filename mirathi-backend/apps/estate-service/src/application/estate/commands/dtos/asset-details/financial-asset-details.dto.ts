import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FinancialAssetDetailsDto {
  @IsString()
  @IsNotEmpty()
  institutionName: string; // Bank Name, SACCO Name

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  accountType: string; // SAVINGS, CURRENT, SHARES, FIXED_DEPOSIT

  @IsString()
  @IsOptional()
  branchName?: string;

  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @IsBoolean()
  isJointAccount: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  jointAccountHolders?: string[];
  @IsString() @IsNotEmpty() currency: string;
}
