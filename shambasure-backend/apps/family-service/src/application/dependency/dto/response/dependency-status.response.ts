import { ApiProperty } from '@nestjs/swagger';

export class DependencyStatistics {
  @ApiProperty({ description: 'Total number of dependants registered' })
  totalDependants: number;

  @ApiProperty({ description: 'Number of priority dependants (S.29(a): Spouse/Children)' })
  priorityDependants: number;

  @ApiProperty({ description: 'Number of conditional dependants (S.29(b): Parents/Siblings)' })
  conditionalDependants: number; // Renamed from nonPriority for legal clarity

  @ApiProperty({ description: 'Number of other dependants (S.29(c): "Living as wife" etc.)' })
  otherDependants: number; // Added for S.29(c) coverage

  @ApiProperty({ description: 'Number of active S.26 financial provision claimants' })
  s26Claimants: number;

  @ApiProperty({ description: 'Number of dependants with valid court orders' })
  withCourtOrders: number;

  @ApiProperty({ description: 'Number of minors (Under 18)' })
  minors: number;

  @ApiProperty({ description: 'Number of students (Over 18 but enrolled)' })
  students: number;

  @ApiProperty({ description: 'Number with disabilities (S.29(2) Special Provision)' })
  withDisabilities: number;

  @ApiProperty({ description: 'Number of FULL dependants (100% dependency)' })
  fullDependants: number;

  @ApiProperty({ description: 'Number of PARTIAL dependants (<100% dependency)' })
  partialDependants: number;

  @ApiProperty({ description: 'Number of dependants verified by court/registrar' })
  verifiedByCourt: number;

  @ApiProperty({ description: 'Total value of all S.26 claims (KES)' })
  totalClaimAmount: number;

  @ApiProperty({ description: 'Total value of all court-approved provisions (KES)' })
  totalCourtApprovedAmount: number;

  @ApiProperty({ description: 'Total gap between claims and approved amounts (KES)' })
  provisionGap: number; // Added for financial risk assessment

  @ApiProperty({ description: 'Average dependency percentage across all dependants' })
  averageDependencyPercentage: number;
}

export class ComplianceIssue {
  @ApiProperty({ description: 'Issue code for programmatic handling' })
  code: string;

  @ApiProperty({ description: 'Human-readable description of the compliance gap' })
  message: string;

  @ApiProperty({ enum: ['CRITICAL', 'WARNING', 'INFO'], description: 'Severity of the issue' })
  severity: 'CRITICAL' | 'WARNING' | 'INFO';

  @ApiProperty({ description: 'ID of the specific dependant causing the issue, if applicable' })
  relatedDependantId?: string;
}

export class DependantSummary {
  @ApiProperty({ description: 'Dependant ID' })
  dependantId: string;

  @ApiProperty({ description: 'Dependant name' })
  name: string;

  @ApiProperty({ description: 'Relationship to deceased (e.g., SPOUSE, CHILD)' })
  relationship: string;

  @ApiProperty({ description: 'Dependency level (FULL/PARTIAL/NONE)' })
  dependencyLevel: string;

  @ApiProperty({ description: 'Dependency percentage (0-100)' })
  dependencyPercentage: number;

  @ApiProperty({ description: 'Monthly support amount (KES)' })
  monthlySupport?: number;

  @ApiProperty({ description: 'Whether a valid court order exists for this dependant' })
  hasCourtOrder: boolean;

  @ApiProperty({ description: 'Court approved provision amount (KES) if any' })
  courtApprovedAmount?: number;

  @ApiProperty({ description: 'Is compliant with S.29 requirements' })
  isCompliant: boolean;
}

export class DependencyStatusResponse {
  @ApiProperty({ description: 'Deceased person ID' })
  deceasedId: string;

  @ApiProperty({ description: 'Deceased person name' })
  deceasedName: string;

  @ApiProperty({
    enum: ['COMPLETE', 'IN_PROGRESS', 'PENDING', 'DISPUTED'],
    description: 'Overall dependency assessment status',
  })
  status: 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'DISPUTED';

  @ApiProperty({ description: 'Date of status assessment (ISO 8601)' })
  assessmentDate: string;

  @ApiProperty({
    type: DependencyStatistics,
    description: 'Statistical summary of the estate dependants',
  })
  statistics: DependencyStatistics;

  @ApiProperty({ type: [DependantSummary], description: 'List of individual dependants' })
  dependants: DependantSummary[];

  @ApiProperty({ description: 'Compliance status with Law of Succession Act' })
  compliance: {
    s29Compliant: boolean;
    s26ClaimsResolved: boolean;
    courtOrdersFiled: boolean;
    evidenceComplete: boolean;
    issues: ComplianceIssue[]; // Enhanced from string[] to structured object
  };

  @ApiProperty({ description: 'List of recommended next steps' })
  nextSteps: string[];

  @ApiProperty({ description: 'Estimated date of completion' })
  estimatedCompletion?: string;
}
