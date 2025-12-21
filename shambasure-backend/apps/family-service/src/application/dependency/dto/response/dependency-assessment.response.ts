import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DependencyLevel, KenyanLawSection } from '@prisma/client';

export class EvidenceDocumentResponse {
  @ApiProperty({ description: 'Document ID' })
  documentId: string;

  @ApiProperty({ description: 'Type of evidence (e.g., BIRTH_CERTIFICATE, AFFIDAVIT)' })
  evidenceType: string;

  @ApiProperty({ description: 'Date added (ISO 8601)' })
  addedAt: string;

  @ApiPropertyOptional({ description: 'Verification status' })
  verified?: boolean;

  @ApiPropertyOptional({ description: 'User ID who verified the document' })
  verifiedBy?: string;

  @ApiPropertyOptional({ description: 'Date verified (ISO 8601)' })
  verifiedAt?: string;
}

export class DependencyAssessmentResponse {
  @ApiProperty({ description: 'Unique Assessment ID' })
  id: string;

  @ApiProperty({ description: 'Deceased Person ID' })
  deceasedId: string;

  @ApiProperty({ description: 'Dependant Person ID' })
  dependantId: string;

  @ApiProperty({ description: 'Deceased Name' })
  deceasedName?: string;

  @ApiProperty({ description: 'Dependant Name' })
  dependantName?: string;

  @ApiPropertyOptional({
    enum: KenyanLawSection,
    description: 'Applicable Law Section (e.g., S29_DEPENDANTS, S26_DEPENDANT_PROVISION)',
  })
  basisSection?: KenyanLawSection;

  @ApiProperty({ description: 'Basis of relationship (e.g., SPOUSE, CHILD, PARENT)' })
  dependencyBasis: string;

  @ApiProperty({
    enum: DependencyLevel,
    description: 'Calculated Dependency Level (FULL/PARTIAL/NONE)',
  })
  dependencyLevel: DependencyLevel;

  @ApiProperty({ description: 'Calculated Dependency Percentage (0-100)' })
  dependencyPercentage: number;

  // --- Demographic Flags ---

  @ApiProperty({ description: 'Is the dependant a minor (<18)?' })
  isMinor: boolean;

  @ApiProperty({ description: 'Is the dependant a student?' })
  isStudent: boolean;

  @ApiPropertyOptional({ description: 'Expected graduation date (ISO 8601)' })
  studentUntil?: string;

  // --- Disability (S.29(2)) ---

  @ApiProperty({ description: 'Has physical disability?' })
  hasPhysicalDisability: boolean;

  @ApiProperty({ description: 'Has mental disability?' })
  hasMentalDisability: boolean;

  @ApiProperty({ description: 'Requires ongoing care/nursing?' })
  requiresOngoingCare: boolean;

  @ApiPropertyOptional({ description: 'Details of the disability' })
  disabilityDetails?: string;

  // --- S.26 Claim Info ---

  @ApiProperty({ description: 'Has an S.26 financial provision claim been filed?' })
  isClaimant: boolean;

  @ApiPropertyOptional({ description: 'Amount claimed under S.26 (KES)' })
  claimAmount?: number;

  @ApiPropertyOptional({ description: 'Amount provisioned/approved (KES)' })
  provisionAmount?: number;

  @ApiProperty({ description: 'Currency Code', default: 'KES' })
  currency: string;

  // --- Court Order Info ---

  @ApiProperty({ description: 'Has a court order been issued?' })
  provisionOrderIssued: boolean;

  @ApiPropertyOptional({ description: 'Court Order Reference Number' })
  courtOrderReference?: string;

  @ApiPropertyOptional({ description: 'Date of Court Order (ISO 8601)' })
  courtOrderDate?: string;

  @ApiPropertyOptional({ description: 'Court Approved Amount (KES)' })
  courtApprovedAmount?: number;

  @ApiPropertyOptional({ description: 'Specific Provision Order Number' })
  provisionOrderNumber?: string;

  // --- Financial Evidence (S.29(b)) ---

  @ApiPropertyOptional({ description: 'Monthly support received (KES)' })
  monthlySupport?: number;

  @ApiPropertyOptional({ description: 'Support Start Date (ISO 8601)' })
  supportStartDate?: string;

  @ApiPropertyOptional({ description: 'Support End Date (ISO 8601)' })
  supportEndDate?: string;

  @ApiPropertyOptional({ description: 'Proven monthly support amount (KES)' })
  monthlySupportEvidence?: number;

  @ApiPropertyOptional({ description: 'Calculated dependency ratio (0-1)' })
  dependencyRatio?: number;

  // --- Assessment Meta ---

  @ApiProperty({ description: 'Date of last assessment (ISO 8601)' })
  assessmentDate: string;

  @ApiPropertyOptional({ description: 'Method used for assessment' })
  assessmentMethod?: string;

  @ApiPropertyOptional({ description: 'Legal age limit for dependency (e.g. 18 or 25)' })
  ageLimit?: number;

  // --- Custody ---

  @ApiPropertyOptional({ description: 'ID of Custodial Parent (for minors)' })
  custodialParentId?: string;

  @ApiPropertyOptional({ description: 'Name of Custodial Parent' })
  custodialParentName?: string;

  // --- Evidence ---

  @ApiPropertyOptional({ type: [EvidenceDocumentResponse], description: 'List of proof documents' })
  dependencyProofDocuments?: EvidenceDocumentResponse[];

  // --- Verification ---

  @ApiPropertyOptional({ description: 'Date verified by Court/Registrar (ISO 8601)' })
  verifiedByCourtAt?: string;

  // --- Computed Legal Status ---

  @ApiProperty({ description: 'Is Priority Dependant (S.29(a) - Spouse/Child)?' })
  isPriorityDependant: boolean;

  @ApiProperty({ description: 'Legally qualifies as dependant under Section 29?' })
  qualifiesForS29: boolean;

  @ApiProperty({
    enum: ['NO_CLAIM', 'PENDING', 'APPROVED', 'DENIED'],
    description: 'Current status of S.26 claim',
  })
  s26ClaimStatus: 'NO_CLAIM' | 'PENDING' | 'APPROVED' | 'DENIED';

  @ApiProperty({ description: 'Is fully compliant with S.29 evidence requirements?' })
  isS29Compliant: boolean;

  // --- Audit ---

  @ApiProperty({ description: 'Record Version' })
  version: number;

  @ApiProperty({ description: 'Created At (ISO 8601)' })
  createdAt: string;

  @ApiProperty({ description: 'Updated At (ISO 8601)' })
  updatedAt: string;
}
