// application/guardianship/dto/request/file-annual-report.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class FileAnnualReportRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiProperty({
    description: 'Date of the report',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  reportDate: Date;

  @ApiProperty({
    description: 'Report summary/content',
    example:
      "Annual report covering the ward's welfare, education, and property management for 2023",
  })
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ApiPropertyOptional({
    description: 'Optional attachments/metadata',
    example: { attachments: ['report.pdf', 'expenses.xlsx'] },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'ID of person approving the report (if applicable)',
    example: 'auditor-123',
  })
  @IsOptional()
  @IsString()
  approvedBy?: string;
}
