// application/dependency/dto/response/dependency-assessment.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DependencyLevel, KenyanLawSection } from '@prisma/client';

export class EvidenceDocumentResponse {
  @ApiProperty({ description: 'Document ID' })
  documentId: string;

  @ApiProperty({ description: 'Type of evidence' })
  evidenceType: string;

  @ApiProperty({ description: 'When evidence was added' })
  addedAt: string;

  @ApiPropertyOptional({ description: 'Verification status' })
  verified?: boolean;

  @ApiPropertyOptional({ description: 'Verified by user ID' })
  verifiedBy?: string;

  @ApiPropertyOptional({ description: 'Verification date' })
  verifiedAt?: string;
}

export class DependencyAssessmentResponse {
  @ApiProperty({ description: 'Dependency assessment ID' })
  id: string;

  @ApiProperty({ description: 'Deceased person ID' })
  deceasedId: string;

  @ApiProperty({ description: 'Dependant person ID' })
  dependantId: string;

  @ApiProperty({ description: 'Deceased person name (if available)' })
  deceasedName?: string;

  @ApiProperty({ description: 'Dependant person name (if available)' })
  dependantName?: string;

  @ApiPropertyOptional({ enum: KenyanLawSection, description: 'Legal basis section' })
  basisSection?: KenyanLawSection;

  @ApiProperty({ description: 'Dependency basis' })
  dependencyBasis: string;

  @ApiProperty({ enum: DependencyLevel, description: 'Dependency level' })
  dependencyLevel: DependencyLevel;

  @ApiProperty({ description: 'Dependency percentage (0-100)' })
  dependencyPercentage: number;

  @ApiProperty({ description: 'Whether dependant is a minor' })
  isMinor: boolean;

  @ApiProperty({ description: 'Whether dependant is a student' })
  isStudent: boolean;

  @ApiPropertyOptional({ description: 'Student status until date' })
  studentUntil?: string;

  @ApiProperty({ description: 'Has physical disability' })
  hasPhysicalDisability: boolean;

  @ApiProperty({ description: 'Has mental disability' })
  hasMentalDisability: boolean;

  @ApiProperty({ description: 'Requires ongoing care' })
  requiresOngoingCare: boolean;

  @ApiPropertyOptional({ description: 'Disability details' })
  disabilityDetails?: string;

  // S.26 Claim information
  @ApiProperty({ description: 'Whether this is an S.26 claimant' })
  isClaimant: boolean;

  @ApiPropertyOptional({ description: 'Claim amount if S.26 claimant' })
  claimAmount?: number;

  @ApiPropertyOptional({ description: 'Court provision amount' })
  provisionAmount?: number;

  @ApiProperty({ description: 'Currency', default: 'KES' })
  currency: string;

  // Court order information
  @ApiProperty({ description: 'Whether court order has been issued' })
  provisionOrderIssued: boolean;

  @ApiPropertyOptional({ description: 'Court order reference number' })
  courtOrderReference?: string;

  @ApiPropertyOptional({ description: 'Court order date' })
  courtOrderDate?: string;

  @ApiPropertyOptional({ description: 'Court approved amount' })
  courtApprovedAmount?: number;

  @ApiPropertyOptional({ description: 'Provision order number' })
  provisionOrderNumber?: string;

  // Financial evidence
  @ApiPropertyOptional({ description: 'Monthly support amount' })
  monthlySupport?: number;

  @ApiPropertyOptional({ description: 'Support start date' })
  supportStartDate?: string;

  @ApiPropertyOptional({ description: 'Support end date' })
  supportEndDate?: string;

  @ApiPropertyOptional({ description: 'Monthly support evidence amount' })
  monthlySupportEvidence?: number;

  @ApiPropertyOptional({ description: 'Dependency ratio (0-1)' })
  dependencyRatio?: number;

  // Assessment details
  @ApiProperty({ description: 'Assessment date' })
  assessmentDate: string;

  @ApiPropertyOptional({ description: 'Assessment method used' })
  assessmentMethod?: string;

  @ApiPropertyOptional({ description: 'Age limit for dependency' })
  ageLimit?: number;

  // Custodial parent
  @ApiPropertyOptional({ description: 'Custodial parent ID for minors' })
  custodialParentId?: string;

  @ApiPropertyOptional({ description: 'Custodial parent name' })
  custodialParentName?: string;

  // Evidence documents
  @ApiPropertyOptional({ type: [EvidenceDocumentResponse], description: 'Proof documents' })
  dependencyProofDocuments?: EvidenceDocumentResponse[];

  // Verification
  @ApiPropertyOptional({ description: 'Verified by court date' })
  verifiedByCourtAt?: string;

  // Computed properties
  @ApiProperty({ description: 'Whether this is a priority dependant (spouse/child)' })
  isPriorityDependant: boolean;

  @ApiProperty({ description: 'Qualifies under Section 29' })
  qualifiesForS29: boolean;

  @ApiProperty({
    enum: ['NO_CLAIM', 'PENDING', 'APPROVED', 'DENIED'],
    description: 'S.26 claim status',
  })
  s26ClaimStatus: 'NO_CLAIM' | 'PENDING' | 'APPROVED' | 'DENIED';

  @ApiProperty({ description: 'Whether S.29 compliant' })
  isS29Compliant: boolean;

  // Audit
  @ApiProperty({ description: 'Version for optimistic concurrency' })
  version: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}
