// application/dependency/dto/response/dependency-status.response.ts
import { ApiProperty } from '@nestjs/swagger';

export class DependencyStatistics {
  @ApiProperty({ description: 'Total number of dependants' })
  totalDependants: number;

  @ApiProperty({ description: 'Number of priority dependants (spouse/children)' })
  priorityDependants: number;

  @ApiProperty({ description: 'Number of non-priority dependants' })
  nonPriorityDependants: number;

  @ApiProperty({ description: 'Number of S.26 claimants' })
  s26Claimants: number;

  @ApiProperty({ description: 'Number with court orders' })
  withCourtOrders: number;

  @ApiProperty({ description: 'Number of minors' })
  minors: number;

  @ApiProperty({ description: 'Number of students' })
  students: number;

  @ApiProperty({ description: 'Number with disabilities' })
  withDisabilities: number;

  @ApiProperty({ description: 'Number of full dependants' })
  fullDependants: number;

  @ApiProperty({ description: 'Number of partial dependants' })
  partialDependants: number;

  @ApiProperty({ description: 'Number verified by court' })
  verifiedByCourt: number;

  @ApiProperty({ description: 'Total S.26 claim amount' })
  totalClaimAmount: number;

  @ApiProperty({ description: 'Total court approved amount' })
  totalCourtApprovedAmount: number;

  @ApiProperty({ description: 'Average dependency percentage' })
  averageDependencyPercentage: number;
}

export class DependantSummary {
  @ApiProperty({ description: 'Dependant ID' })
  dependantId: string;

  @ApiProperty({ description: 'Dependant name' })
  name: string;

  @ApiProperty({ description: 'Relationship to deceased' })
  relationship: string;

  @ApiProperty({ description: 'Dependency level' })
  dependencyLevel: string;

  @ApiProperty({ description: 'Dependency percentage' })
  dependencyPercentage: number;

  @ApiProperty({ description: 'Monthly support amount' })
  monthlySupport?: number;

  @ApiProperty({ description: 'Whether court order exists' })
  hasCourtOrder: boolean;

  @ApiProperty({ description: 'Court approved amount if any' })
  courtApprovedAmount?: number;
}

export class DependencyStatusResponse {
  @ApiProperty({ description: 'Deceased person ID' })
  deceasedId: string;

  @ApiProperty({ description: 'Deceased person name' })
  deceasedName: string;

  @ApiProperty({ description: 'Overall dependency status' })
  status: 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'DISPUTED';

  @ApiProperty({ description: 'Date of status assessment' })
  assessmentDate: string;

  @ApiProperty({ type: DependencyStatistics, description: 'Statistical summary' })
  statistics: DependencyStatistics;

  @ApiProperty({ type: [DependantSummary], description: 'List of dependants' })
  dependants: DependantSummary[];

  @ApiProperty({ description: 'Compliance status with LSA' })
  compliance: {
    s29Compliant: boolean;
    s26ClaimsResolved: boolean;
    courtOrdersFiled: boolean;
    evidenceComplete: boolean;
    issues: string[];
  };

  @ApiProperty({ description: 'Next steps or actions required' })
  nextSteps: string[];

  @ApiProperty({ description: 'Estimated time to complete dependency assessment' })
  estimatedCompletion?: string;
}
