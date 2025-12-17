// application/guardianship/dto/request/extend-guardianship.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExtendGuardianshipRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiProperty({
    description: 'New valid until date',
    example: '2027-01-15T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  newValidUntil: Date;

  @ApiPropertyOptional({
    description: 'Court order number for extension',
    example: 'HC/EXT/901/2024',
  })
  @IsOptional()
  @IsString()
  courtOrderNumber?: string;
}
