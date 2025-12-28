import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class MoneyRequestDto {
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
}

export class VerifyClaimRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  verificationNotes: string;
}

export class RejectClaimRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class SettleClaimRequestDto {
  @ApiProperty({ type: MoneyRequestDto })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  allocation: MoneyRequestDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  settlementMethod?: string;
}
