import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class ExecutionDetailsDto {
  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty()
  @IsNumber()
  witnessesPresent: number;
}

export class AddCodicilRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty({ enum: ['ADDITION', 'MODIFICATION', 'REVOCATION'] })
  @IsEnum(['ADDITION', 'MODIFICATION', 'REVOCATION'])
  amendmentType: 'ADDITION' | 'MODIFICATION' | 'REVOCATION';

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedClauses?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalBasis?: string;

  @ApiProperty({ type: ExecutionDetailsDto })
  @ValidateNested()
  @Type(() => ExecutionDetailsDto)
  executionDetails: ExecutionDetailsDto;

  @ApiProperty()
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
  witnessIds: string[];
}
