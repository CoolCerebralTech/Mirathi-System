import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export enum ReportType {
  FULL_ESTATE_SUMMARY = 'FULL_ESTATE_SUMMARY',
  INVENTORY_SCHEDULE = 'INVENTORY_SCHEDULE',
  LIABILITIES_SCHEDULE = 'LIABILITIES_SCHEDULE',
  DISTRIBUTION_ACCOUNT = 'DISTRIBUTION_ACCOUNT',
  TAX_COMPLIANCE_PROOF = 'TAX_COMPLIANCE_PROOF',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  JSON = 'JSON',
}

export class GenerateEstateReportDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsEnum(ReportFormat)
  format: ReportFormat;

  @IsString()
  @IsNotEmpty()
  generatedBy: string;
}
