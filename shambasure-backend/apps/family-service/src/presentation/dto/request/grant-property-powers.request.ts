// application/guardianship/dto/request/grant-property-powers.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GrantPropertyPowersRequest {
  @ApiPropertyOptional({
    description: 'Court order number granting property powers',
    example: 'HC/SUCC/PROP/123/2024',
  })
  @IsOptional()
  @IsString()
  courtOrderNumber?: string;

  @ApiProperty({
    description: 'Specific powers being granted (JSON format)',
    example: {
      canSellProperty: false,
      canMortgageProperty: false,
      canLeaseProperty: true,
      maximumLeaseTerm: '2 years',
      requiresFamilyConsent: true,
    },
  })
  @IsNotEmpty()
  restrictions: any;

  @ApiPropertyOptional({
    description: 'Bond amount increase (if required for property powers)',
    example: 2000000,
  })
  @IsOptional()
  increasedBondAmountKES?: number;
}
