import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class MoneyRequestDto {
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
}

export class ApproveLiquidationRequestDto {
  @ApiProperty({ description: 'Court Order allowing sale' })
  @IsString()
  @IsNotEmpty()
  courtOrderReference: string;
}

export class RecordLiquidationSaleRequestDto {
  @ApiProperty({ type: MoneyRequestDto, description: 'Final Sale Price' })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  actualAmount: MoneyRequestDto;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  saleDate: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  buyerName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  buyerIdNumber?: string;
}

export class ReceiveLiquidationProceedsRequestDto {
  @ApiProperty({ type: MoneyRequestDto, description: 'Net cash received' })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  netProceeds: MoneyRequestDto;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  receivedDate: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankReference?: string;
}
