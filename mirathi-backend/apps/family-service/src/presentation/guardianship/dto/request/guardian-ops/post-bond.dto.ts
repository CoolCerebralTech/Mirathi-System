import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class PostBondDto {
  @ApiProperty({ description: 'Value of the bond in KES' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Name of the Insurance/Bank providing surety' })
  @IsString()
  @IsNotEmpty()
  suretyCompany: string;

  @ApiProperty({ description: 'Unique reference number from the Surety' })
  @IsString()
  @IsNotEmpty()
  bondReference: string;

  @ApiPropertyOptional({ description: 'Link to digital verification document' })
  @IsOptional()
  @IsUrl()
  digitalVerificationUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courtOrderReference?: string;
}
