// application/guardianship/dto/request/validate-property-access.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class ValidatePropertyAccessRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiProperty({
    description: 'Type of property access being requested',
    example: 'SELL_PROPERTY',
  })
  @IsString()
  @IsNotEmpty()
  accessType: string;

  @ApiPropertyOptional({
    description: 'Additional context for validation',
    example: { propertyValueKES: 2000000, transactionType: 'sale' },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}
