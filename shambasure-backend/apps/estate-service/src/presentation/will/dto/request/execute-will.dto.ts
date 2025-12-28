import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

class WitnessDeclarationDto {
  @ApiProperty({ description: 'Confirms witness is not a beneficiary (S.11(2) LSA)' })
  @IsBoolean()
  isNotBeneficiary: boolean;

  @ApiProperty()
  @IsBoolean()
  isNotSpouseOfBeneficiary: boolean;

  @ApiProperty()
  @IsBoolean()
  isOfSoundMind: boolean;

  @ApiProperty()
  @IsBoolean()
  understandsDocument: boolean;

  @ApiProperty()
  @IsBoolean()
  isActingVoluntarily: boolean;
}

class WitnessExecutionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Kenyan National ID Format', example: '12345678' })
  @IsString()
  @Matches(/^[1-3]\d{7}$/, { message: 'Invalid Kenyan National ID format' })
  nationalId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber('KE')
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  physicalAddress?: string;

  @ApiProperty({ type: WitnessDeclarationDto })
  @ValidateNested()
  @Type(() => WitnessDeclarationDto)
  declarations: WitnessDeclarationDto;
}

export class ExecuteWillRequestDto {
  @ApiProperty({ description: 'Date of signing. Cannot be in the future.' })
  @IsDateString()
  executionDate: string;

  @ApiProperty({ description: 'Physical location of signing for jurisdiction' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ default: 'Africa/Nairobi' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ type: [WitnessExecutionDto], minItems: 2 })
  @IsArray()
  @ArrayMinSize(2, { message: 'At least 2 witnesses are required for valid execution (S.11 LSA)' })
  @ValidateNested({ each: true })
  @Type(() => WitnessExecutionDto)
  witnesses: WitnessExecutionDto[];
}
