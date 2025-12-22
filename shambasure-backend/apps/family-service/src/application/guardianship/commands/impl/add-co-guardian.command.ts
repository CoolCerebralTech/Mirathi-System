// application/guardianship/commands/impl/approve-annual-report.command.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseCommand } from '../base.command';

export class ApproveAnnualReportCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'ApproveAnnualReportCommand',
  })
  getCommandName(): string {
    return 'ApproveAnnualReportCommand';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiProperty({
    description: 'Auditor/Registrar ID approving the report',
    example: 'AUD-001',
  })
  @IsNotEmpty()
  @IsString()
  readonly auditorId: string;

  @ApiPropertyOptional({
    description: 'Audit notes or comments',
    example: 'Report verified, all expenses accounted for',
  })
  @IsOptional()
  @IsString()
  readonly auditNotes?: string;

  @ApiPropertyOptional({
    description: 'Court registry reference',
    example: 'REG/APP/2024/001',
  })
  @IsOptional()
  @IsString()
  readonly registryReference?: string;

  @ApiPropertyOptional({
    description: 'Approval certificate number',
    example: 'CERT/APP/2024/123',
  })
  @IsOptional()
  @IsString()
  readonly approvalCertificate?: string;

  @ApiPropertyOptional({
    description: 'Recommendations for next period',
    example: 'Consider increasing educational allowance due to rising school fees',
  })
  @IsOptional()
  @IsString()
  readonly recommendations?: string;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      auditorId: string;
      auditNotes?: string;
      registryReference?: string;
      approvalCertificate?: string;
      recommendations?: string;
    },
  ) {
    super(commandId, timestamp, userId, correlationId);

    this.guardianshipId = data.guardianshipId;
    this.auditorId = data.auditorId;
    this.auditNotes = data.auditNotes;
    this.registryReference = data.registryReference;
    this.approvalCertificate = data.approvalCertificate;
    this.recommendations = data.recommendations;
  }
}
