// application/guardianship/dto/request/grant-property-powers.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class GrantPropertyPowersRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiPropertyOptional({
    description: 'Court order number granting property powers',
    example: 'HC/PROP/789/2024',
  })
  @IsOptional()
  @IsString()
  courtOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Restrictions on property powers (JSON)',
    example: {
      maximumTransactionAmount: 1000000,
      requiresCourtApprovalForSale: true,
      investmentRestrictions: ['no_high_risk'],
    },
  })
  @IsOptional()
  @IsObject()
  restrictions?: Record<string, any>;
}
