import { ApiProperty } from '@nestjs/swagger';

class ComplianceIssueDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: ['MEDIUM', 'HIGH', 'CRITICAL'] })
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

class LegalSectionResultDto {
  @ApiProperty({ enum: ['PASS', 'WARN', 'FAIL'] })
  status: 'PASS' | 'WARN' | 'FAIL';

  @ApiProperty({ type: [ComplianceIssueDto] })
  issues: ComplianceIssueDto[];
}

class SectionAnalysisDto {
  @ApiProperty({ type: LegalSectionResultDto })
  s5_capacity: LegalSectionResultDto;

  @ApiProperty({ type: LegalSectionResultDto })
  s11_execution: LegalSectionResultDto;

  @ApiProperty({ type: LegalSectionResultDto })
  s26_dependants: LegalSectionResultDto;

  @ApiProperty({ type: LegalSectionResultDto })
  s83_executors: LegalSectionResultDto;
}

export class ComplianceReportResponseDto {
  @ApiProperty()
  willId: string;

  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ enum: ['COMPLIANT', 'AT_RISK', 'NON_COMPLIANT'] })
  overallStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';

  @ApiProperty({ description: 'Risk Score 0-100 (100 = Safe)' })
  riskScore: number;

  @ApiProperty({ type: SectionAnalysisDto })
  sectionAnalysis: SectionAnalysisDto;

  @ApiProperty({ type: [ComplianceIssueDto] })
  violations: ComplianceIssueDto[];

  @ApiProperty({ type: [ComplianceIssueDto] })
  warnings: ComplianceIssueDto[];

  @ApiProperty({ type: [String] })
  recommendations: string[];
}
