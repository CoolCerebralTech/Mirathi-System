import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

class InitialCashRequestDto {
  @ApiProperty({ example: 100000, description: 'Amount of liquid cash available at start' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'KES', description: 'ISO 4217 Currency Code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/)
  currency: string;
}

export class CreateEstateRequestDto {
  @ApiProperty({ example: 'Estate of the Late John Doe', description: 'Legal name of the estate' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Family Member ID of the deceased',
  })
  @IsString()
  @IsNotEmpty()
  deceasedId: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the deceased' })
  @IsString()
  @IsNotEmpty()
  deceasedName: string;

  @ApiProperty({
    example: '2023-12-01T00:00:00Z',
    description: 'Date of death (critical for S.2 Limitation)',
  })
  @Type(() => Date)
  @IsDate()
  dateOfDeath: Date;

  @ApiProperty({
    example: 'A123456789Z',
    description: 'KRA PIN of the deceased (Required for Tax Compliance)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]\d{9}[A-Z]$/, { message: 'Invalid KRA PIN format' })
  kraPin: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID of the Executor/Administrator',
  })
  @IsString()
  @IsNotEmpty()
  executorId: string;

  @ApiPropertyOptional({
    example: 'E123/2024',
    description: 'High Court Case Number if P&A 80 filed',
  })
  @IsString()
  @IsOptional()
  courtCaseNumber?: string;

  @ApiPropertyOptional({ description: 'Initial liquid assets' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InitialCashRequestDto)
  initialCash?: InitialCashRequestDto;
}
