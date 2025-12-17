// application/family/dto/response/kenyan-legal-compliance.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ComplianceIssueResponse {
  @ApiProperty({
    description: 'Issue code',
    example: 'S40_NO_CERTIFICATE',
  })
  code: string;

  @ApiProperty({
    description: 'Issue severity',
    example: 'HIGH',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  severity: string;

  @ApiProperty({
    description: 'Issue title',
    example: 'Missing S.40 Certificate for Polygamous House',
  })
  title: string;

  @ApiProperty({
    description: 'Detailed description',
    example:
      'House "House of Amina" (Order: 2) lacks S.40 court certificate required by Law of Succession Act.',
  })
  description: string;

  @ApiProperty({
    description: 'Kenyan law section reference',
    example: 'Law of Succession Act, Section 40(1)',
  })
  lawReference: string;

  @ApiPropertyOptional({
    description: 'Affected member/house ID',
    example: 'hse-1234567890',
  })
  affectedId?: string;

  @ApiPropertyOptional({
    description: 'Affected member/house name',
    example: 'House of Amina',
  })
  affectedName?: string;

  @ApiProperty({
    description: 'Recommended action',
    example: 'Obtain court certificate for polygamous house',
  })
  recommendation: string;

  @ApiProperty({
    description: 'Whether issue is resolved',
    example: false,
  })
  isResolved: boolean;

  @ApiPropertyOptional({
    description: 'Resolution date',
    example: null,
  })
  resolvedAt?: Date;

  @ApiPropertyOptional({
    description: 'User who resolved the issue',
    example: null,
  })
  resolvedBy?: string;
}

export class Section29ComplianceResponse {
  @ApiProperty({
    description: 'Number of potential S.29 dependants',
    example: 5,
  })
  potentialDependants: number;

  @ApiProperty({
    description: 'Number of verified S.29 dependants',
    example: 3,
  })
  verifiedDependants: number;

  @ApiProperty({
    description: 'Number of dependant claims filed',
    example: 2,
  })
  claimsFiled: number;

  @ApiProperty({
    description: 'Number of court provisions ordered',
    example: 1,
  })
  courtProvisions: number;

  @ApiProperty({
    description: 'Total estimated dependency value (KES)',
    example: 1500000,
  })
  totalDependencyValue: number;

  @ApiProperty({
    description: 'Compliance status',
    example: 'PARTIAL',
    enum: ['COMPLIANT', 'PARTIAL', 'NON_COMPLIANT', 'NOT_APPLICABLE'],
  })
  status: string;

  @ApiProperty({
    description: 'Compliance issues',
    type: () => ComplianceIssueResponse,
    isArray: true,
  })
  @Type(() => ComplianceIssueResponse)
  issues: ComplianceIssueResponse[];
}

export class Section40ComplianceResponse {
  @ApiProperty({
    description: 'Is family polygamous',
    example: true,
  })
  isPolygamous: boolean;

  @ApiProperty({
    description: 'Number of polygamous houses',
    example: 3,
  })
  totalHouses: number;

  @ApiProperty({
    description: 'Number of court-certified houses',
    example: 2,
  })
  certifiedHouses: number;

  @ApiProperty({
    description: 'Number of houses with wives consent',
    example: 3,
  })
  housesWithConsent: number;

  @ApiProperty({
    description: 'Total house shares percentage',
    example: 100,
  })
  totalSharesPercentage: number;

  @ApiProperty({
    description: 'Compliance status',
    example: 'PARTIAL',
    enum: ['COMPLIANT', 'PARTIAL', 'NON_COMPLIANT', 'NOT_APPLICABLE'],
  })
  status: string;

  @ApiProperty({
    description: 'Compliance issues',
    type: () => ComplianceIssueResponse,
    isArray: true,
  })
  @Type(() => ComplianceIssueResponse)
  issues: ComplianceIssueResponse[];
}

export class Section70ComplianceResponse {
  @ApiProperty({
    description: 'Number of minor children',
    example: 5,
  })
  minorChildren: number;

  @ApiProperty({
    description: 'Number of appointed guardians',
    example: 3,
  })
  appointedGuardians: number;

  @ApiProperty({
    description: 'Number of guardians with posted bonds',
    example: 2,
  })
  guardiansWithBonds: number;

  @ApiProperty({
    description: 'Number of pending annual reports',
    example: 1,
  })
  pendingAnnualReports: number;

  @ApiProperty({
    description: 'Compliance status',
    example: 'PARTIAL',
    enum: ['COMPLIANT', 'PARTIAL', 'NON_COMPLIANT', 'NOT_APPLICABLE'],
  })
  status: string;

  @ApiProperty({
    description: 'Compliance issues',
    type: () => ComplianceIssueResponse,
    isArray: true,
  })
  @Type(() => ComplianceIssueResponse)
  issues: ComplianceIssueResponse[];
}

export class ChildrenActComplianceResponse {
  @ApiProperty({
    description: 'Number of adopted children',
    example: 2,
  })
  adoptedChildren: number;

  @ApiProperty({
    description: 'Number of valid adoption orders',
    example: 2,
  })
  validAdoptionOrders: number;

  @ApiProperty({
    description: 'Number of children in need of care and protection',
    example: 1,
  })
  childrenInNeed: number;

  @ApiProperty({
    description: 'Compliance status',
    example: 'COMPLIANT',
    enum: ['COMPLIANT', 'PARTIAL', 'NON_COMPLIANT', 'NOT_APPLICABLE'],
  })
  status: string;

  @ApiProperty({
    description: 'Compliance issues',
    type: () => ComplianceIssueResponse,
    isArray: true,
  })
  @Type(() => ComplianceIssueResponse)
  issues: ComplianceIssueResponse[];
}

export class MarriageActComplianceResponse {
  @ApiProperty({
    description: 'Total marriages',
    example: 4,
  })
  totalMarriages: number;

  @ApiProperty({
    description: 'Number of registered marriages',
    example: 3,
  })
  registeredMarriages: number;

  @ApiProperty({
    description: 'Number of customary marriages',
    example: 2,
  })
  customaryMarriages: number;

  @ApiProperty({
    description: 'Number of Islamic marriages',
    example: 1,
  })
  islamicMarriages: number;

  @ApiProperty({
    description: 'Number of marriages with bride price',
    example: 2,
  })
  marriagesWithBridePrice: number;

  @ApiProperty({
    description: 'Number of marriages with settled property',
    example: 1,
  })
  marriagesWithSettledProperty: number;

  @ApiProperty({
    description: 'Compliance status',
    example: 'PARTIAL',
    enum: ['COMPLIANT', 'PARTIAL', 'NON_COMPLIANT', 'NOT_APPLICABLE'],
  })
  status: string;

  @ApiProperty({
    description: 'Compliance issues',
    type: () => ComplianceIssueResponse,
    isArray: true,
  })
  @Type(() => ComplianceIssueResponse)
  issues: ComplianceIssueResponse[];
}

export class KenyanLegalComplianceResponse {
  @ApiProperty({
    description: 'Family ID',
    example: 'fam-1234567890',
  })
  familyId: string;

  @ApiProperty({
    description: 'Family name',
    example: 'Mwangi',
  })
  familyName: string;

  @ApiProperty({
    description: 'Overall compliance score (0-100)',
    example: 75.5,
  })
  overallScore: number;

  @ApiProperty({
    description: 'Overall compliance status',
    example: 'PARTIAL',
    enum: ['COMPLIANT', 'PARTIAL', 'NON_COMPLIANT', 'CRITICAL'],
  })
  overallStatus: string;

  @ApiProperty({
    description: 'Last compliance check date',
    example: '2024-01-15T10:30:00.000Z',
  })
  lastChecked: Date;

  @ApiProperty({
    description: 'Next compliance check due date',
    example: '2024-04-15T10:30:00.000Z',
  })
  nextCheckDue: Date;

  @ApiProperty({
    description: 'S.29 Dependant Compliance',
    type: () => Section29ComplianceResponse,
  })
  @Type(() => Section29ComplianceResponse)
  section29: Section29ComplianceResponse;

  @ApiProperty({
    description: 'S.40 Polygamy Compliance',
    type: () => Section40ComplianceResponse,
  })
  @Type(() => Section40ComplianceResponse)
  section40: Section40ComplianceResponse;

  @ApiProperty({
    description: 'S.70 Guardianship Compliance',
    type: () => Section70ComplianceResponse,
  })
  @Type(() => Section70ComplianceResponse)
  section70: Section70ComplianceResponse;

  @ApiProperty({
    description: 'Children Act Compliance',
    type: () => ChildrenActComplianceResponse,
  })
  @Type(() => ChildrenActComplianceResponse)
  childrenAct: ChildrenActComplianceResponse;

  @ApiProperty({
    description: 'Marriage Act Compliance',
    type: () => MarriageActComplianceResponse,
  })
  @Type(() => MarriageActComplianceResponse)
  marriageAct: MarriageActComplianceResponse;

  @ApiProperty({
    description: 'Total compliance issues',
    example: 8,
  })
  totalIssues: number;

  @ApiProperty({
    description: 'Critical issues count',
    example: 2,
  })
  criticalIssues: number;

  @ApiProperty({
    description: 'High priority issues count',
    example: 3,
  })
  highIssues: number;

  @ApiProperty({
    description: 'Medium priority issues count',
    example: 2,
  })
  mediumIssues: number;

  @ApiProperty({
    description: 'Low priority issues count',
    example: 1,
  })
  lowIssues: number;

  @ApiProperty({
    description: 'Resolved issues count',
    example: 3,
  })
  resolvedIssues: number;

  @ApiProperty({
    description: 'All compliance issues',
    type: () => ComplianceIssueResponse,
    isArray: true,
  })
  @Type(() => ComplianceIssueResponse)
  allIssues: ComplianceIssueResponse[];

  @ApiProperty({
    description: 'Compliance history',
    example: [
      { date: '2023-10-15', score: 65, status: 'PARTIAL' },
      { date: '2024-01-15', score: 75.5, status: 'PARTIAL' },
    ],
  })
  history: Array<{
    date: Date;
    score: number;
    status: string;
    checkedBy: string;
  }>;

  @ApiProperty({
    description: 'Recommended actions for compliance improvement',
    example: [
      'Obtain S.40 certificates for polygamous houses',
      'File annual guardianship reports',
      'Register customary marriages with civil registry',
    ],
    type: [String],
  })
  recommendations: string[];

  @ApiProperty({
    description: 'Legal advisor contact information',
    example: {
      name: 'Kenya Law Society',
      phone: '+254202222222',
      email: 'info@lawsocietykenya.org',
      website: 'https://www.lawsocietykenya.org',
    },
  })
  legalAdvisor: {
    name: string;
    phone: string;
    email: string;
    website: string;
  };
}
