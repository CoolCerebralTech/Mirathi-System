import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FuneralWishesDto {
  @IsString()
  @IsOptional()
  burialLocation?: string;

  @IsString()
  @IsOptional()
  funeralType?: string; // "Burial", "Cremation"

  @IsString()
  @IsOptional()
  specificInstructions?: string;
}

class DigitalAssetInstructionsDto {
  @IsString()
  @IsOptional()
  socialMediaHandling?: string;

  @IsString()
  @IsOptional()
  emailAccountHandling?: string;
}

export class UpdateWillDto {
  @IsString()
  @IsOptional()
  title?: string;

  @ValidateNested()
  @Type(() => FuneralWishesDto)
  @IsOptional()
  funeralWishes?: FuneralWishesDto;

  @IsString()
  @IsOptional()
  burialLocation?: string;

  @IsString()
  @IsOptional()
  residuaryClause?: string; // The "Catch-All" clause

  @ValidateNested()
  @Type(() => DigitalAssetInstructionsDto)
  @IsOptional()
  digitalAssetInstructions?: DigitalAssetInstructionsDto;

  @IsString()
  @IsOptional()
  specialInstructions?: string;
}
