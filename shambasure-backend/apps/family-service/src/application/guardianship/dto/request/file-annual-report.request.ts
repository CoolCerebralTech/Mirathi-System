// application/guardianship/dto/request/file-annual-report.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class FileAnnualReportRequest {
  @ApiProperty({
    description: 'Date of report submission',
    example: '2024-12-31T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  reportDate: Date;

  @ApiProperty({
    description: 'Report summary and activities performed',
    example: 'Managed ward education expenses, medical bills, and property maintenance',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(50)
  @MaxLength(5000)
  summary: string;

  @ApiPropertyOptional({
    description: 'Total expenses incurred during period (KES)',
    example: 450000,
  })
  @IsOptional()
  expensesKES?: number;

  @ApiPropertyOptional({
    description: 'Total income generated from ward property (KES)',
    example: 120000,
  })
  @IsOptional()
  incomeKES?: number;

  @ApiPropertyOptional({
    description: 'Bank statements or receipts (array of document IDs)',
    example: ['doc-id-1', 'doc-id-2'],
  })
  @IsOptional()
  supportingDocuments?: string[];

  @ApiPropertyOptional({
    description: 'Court registrar ID for immediate approval',
    example: 'REG-001',
  })
  @IsOptional()
  @IsString()
  approvedBy?: string;

  @ApiPropertyOptional({
    description: 'Welfare assessment by Children Officer',
    example: 'Ward is progressing well in school and shows good health',
  })
  @IsOptional()
  @IsString()
  welfareAssessment?: string;
}
