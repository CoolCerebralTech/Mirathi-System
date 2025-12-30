import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class GuardianshipPowersDto {
  @ApiProperty()
  @IsBoolean()
  canManageProperty: boolean;

  @ApiProperty()
  @IsBoolean()
  canConsentMedical: boolean;

  @ApiProperty()
  @IsBoolean()
  canDecideEducation: boolean;

  @ApiProperty()
  @IsBoolean()
  canTravelWithWard: boolean;

  @ApiProperty()
  @IsBoolean()
  canAccessRecords: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  financialLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class UpdateGuardianPowersDto {
  @ApiProperty({ description: 'The new set of powers to apply' })
  @ValidateNested()
  @Type(() => GuardianshipPowersDto)
  newPowers: GuardianshipPowersDto;

  @ApiProperty({ description: 'Reason for the change (Audit Trail)', minLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;
}
