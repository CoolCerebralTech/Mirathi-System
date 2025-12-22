// application/guardianship/commands/impl/file-annual-report.command.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { BaseCommand } from '../base.command';

export class FileAnnualReportCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'FileAnnualReportCommand',
  })
  getCommandName(): string {
    return 'FileAnnualReportCommand';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiProperty({
    description: 'Date of report submission',
    example: '2024-12-31T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly reportDate: Date;

  @ApiProperty({
    description: 'Report summary and activities performed',
    example: 'Managed ward education expenses, medical bills, and property maintenance',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(50)
  @MaxLength(5000)
  readonly summary: string;

  @ApiPropertyOptional({
    description: 'Total expenses incurred during period (KES)',
    example: 450000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly expensesKES?: number;

  @ApiPropertyOptional({
    description: 'Total income generated from ward property (KES)',
    example: 120000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly incomeKES?: number;

  @ApiPropertyOptional({
    description: 'Supporting document IDs (array of UUIDs)',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    type: [String],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  readonly supportingDocumentIds?: string[];

  @ApiPropertyOptional({
    description: 'Court registrar ID for immediate approval',
    example: 'REG-001',
  })
  @IsOptional()
  @IsString()
  readonly approvedBy?: string;

  @ApiPropertyOptional({
    description: 'Welfare assessment by Children Officer',
    example: 'Ward is progressing well in school and shows good health',
  })
  @IsOptional()
  @IsString()
  readonly welfareAssessment?: string;

  @ApiPropertyOptional({
    description: 'Bank statements summary (JSON format)',
    example: {
      totalDeposits: 500000,
      totalWithdrawals: 450000,
      endingBalance: 50000,
      accountNumber: '1234567890',
    },
  })
  @IsOptional()
  readonly financialSummary?: any;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      reportDate: Date;
      summary: string;
      expensesKES?: number;
      incomeKES?: number;
      supportingDocumentIds?: string[];
      approvedBy?: string;
      welfareAssessment?: string;
      financialSummary?: any;
    },
  ) {
    super(commandId, timestamp, userId, correlationId);

    this.guardianshipId = data.guardianshipId;
    this.reportDate = data.reportDate;
    this.summary = data.summary;
    this.expensesKES = data.expensesKES;
    this.incomeKES = data.incomeKES;
    this.supportingDocumentIds = data.supportingDocumentIds;
    this.approvedBy = data.approvedBy;
    this.welfareAssessment = data.welfareAssessment;
    this.financialSummary = data.financialSummary;
  }
}
