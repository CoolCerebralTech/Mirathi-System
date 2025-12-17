// application/guardianship/dto/request/post-bond.request.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class PostBondRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiProperty({
    description: 'Bond provider/insurance company',
    example: 'Kenya Reinsurance Corporation',
  })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({
    description: 'Bond policy number',
    example: 'BOND/2024/001',
  })
  @IsString()
  @IsNotEmpty()
  policyNumber: string;

  @ApiProperty({
    description: 'Bond expiry date',
    example: '2025-01-15T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  expiryDate: Date;
}
