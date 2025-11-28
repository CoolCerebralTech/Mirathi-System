import { IsString, IsNotEmpty, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CapacityDeclarationDto {
  @IsBoolean()
  isOfAge: boolean;

  @IsBoolean()
  isSoundMind: boolean;

  @IsBoolean()
  understandsNature: boolean; // Understands what a will is

  @IsBoolean()
  understandsAssets: boolean; // Knows what they own

  @IsBoolean()
  freeFromUndueInfluence: boolean;
}

export class CreateWillDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @ValidateNested()
  @Type(() => CapacityDeclarationDto)
  legalCapacity: CapacityDeclarationDto;
}
