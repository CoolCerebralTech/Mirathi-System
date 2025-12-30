import { ApiProperty } from '@nestjs/swagger';

export class MoneyResponseDto {
  @ApiProperty({ example: 1500000 })
  amount: number;

  @ApiProperty({ example: 'KES' })
  currency: string;

  @ApiProperty({ example: 'KES 1,500,000.00', description: 'Pre-formatted string for UI display' })
  formatted: string;
}
