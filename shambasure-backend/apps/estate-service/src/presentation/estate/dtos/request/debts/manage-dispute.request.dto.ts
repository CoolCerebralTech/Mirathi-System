import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

class MoneyRequestDto {
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
}

export class DisputeDebtRequestDto {
  @ApiProperty({ example: 'Services not rendered as per contract' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;

  @ApiPropertyOptional({ description: 'Document ID of proof' })
  @IsString()
  @IsOptional()
  evidenceDocumentId?: string;
}

export class ResolveDebtDisputeRequestDto {
  @ApiProperty({ example: 'Creditor accepted 80% settlement' })
  @IsString()
  @IsNotEmpty()
  resolution: string;

  @ApiPropertyOptional({ description: 'New amount if negotiated' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  negotiatedAmount?: MoneyRequestDto;
}

export class WriteOffDebtRequestDto {
  @ApiProperty({ example: 'Statute barred under Limitation of Actions Act' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Amount to write off (defaults to full)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  amountToWriteOff?: MoneyRequestDto;
}
