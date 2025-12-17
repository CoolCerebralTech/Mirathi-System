// application/guardianship/dto/request/update-restrictions.request.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class UpdateRestrictionsRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiProperty({
    description: 'Updated restrictions (JSON)',
    example: {
      cannotTravelWithoutCourtApproval: true,
      monthlyReportingRequired: true,
      expenditureLimitKES: 50000,
    },
  })
  @IsObject()
  restrictions: Record<string, any>;
}
