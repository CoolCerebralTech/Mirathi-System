// application/guardianship/dto/request/approve-annual-report.request.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApproveAnnualReportRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiProperty({
    description: 'ID of person approving the report',
    example: 'auditor-456',
  })
  @IsString()
  @IsNotEmpty()
  auditorId: string;
}
