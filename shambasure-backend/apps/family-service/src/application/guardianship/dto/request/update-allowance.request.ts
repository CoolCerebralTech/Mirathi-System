// application/guardianship/dto/request/update-allowance.request.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpdateAllowanceRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiProperty({
    description: 'Annual allowance amount in KES',
    example: 150000,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'ID of person approving the allowance',
    example: 'court-clerk-123',
  })
  @IsString()
  @IsNotEmpty()
  approvedBy: string;
}
