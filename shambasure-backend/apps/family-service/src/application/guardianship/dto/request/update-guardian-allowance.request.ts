// application/guardianship/dto/request/update-allowance.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAllowanceRequest {
  @ApiProperty({
    description: 'New annual allowance amount in KES',
    example: 300000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'ID of person approving allowance (Court Registrar ID)',
    example: 'CR-001',
  })
  @IsNotEmpty()
  @IsString()
  approvedBy: string;

  @ApiPropertyOptional({
    description: 'Court order reference for allowance approval',
    example: 'HC/SUCC/ALLOW/123/2024',
  })
  @IsOptional()
  @IsString()
  courtOrderReference?: string;

  @ApiPropertyOptional({
    description: 'Breakdown of allowance components',
    example: {
      education: 120000,
      clothing: 30000,
      medical: 60000,
      entertainment: 30000,
      miscellaneous: 60000,
    },
  })
  @IsOptional()
  breakdown?: Record<string, number>;
}
