// application/guardianship/dto/request/renew-bond.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RenewBondRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiProperty({
    description: 'New bond expiry date',
    example: '2026-01-15T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  newExpiryDate: Date;

  @ApiPropertyOptional({
    description: 'New bond provider (if changed)',
    example: 'APA Insurance',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    description: 'New policy number (if changed)',
    example: 'BOND/2025/001',
  })
  @IsOptional()
  @IsString()
  policyNumber?: string;
}
