import { Injectable } from '@nestjs/common';

import { LegalDependant } from '../../../domain/entities/legal-dependant.entity';
import {
  AssessFinancialDependencyRequest,
  CreateDependencyAssessmentRequest,
  EvidenceDocumentDto,
  FileS26ClaimRequest,
  RecordCourtProvisionRequest,
  SupportingDocumentDto,
} from '../dto/request';
import {
  ComplianceIssue,
  DependantSummary,
  DependencyAssessmentResponse,
  DependencyStatistics,
  DependencyStatusResponse,
  EvidenceDocumentResponse,
} from '../dto/response';

@Injectable()
export class DependencyMapper {
  // --- Request to Domain Mappings ---

  /**
   * Maps CreateDependencyAssessmentRequest to CreateLegalDependantProps
   */
  toCreateLegalDependantProps(request: CreateDependencyAssessmentRequest): any {
    return {
      deceasedId: request.deceasedId,
      dependantId: request.dependantId,
      dependencyBasis: request.dependencyBasis,
      isMinor: request.isMinor,
      dependencyLevel: request.dependencyLevel,
      isStudent: request.isStudent,
      hasPhysicalDisability: request.hasPhysicalDisability,
      hasMentalDisability: request.hasMentalDisability,
      requiresOngoingCare: request.requiresOngoingCare,
      disabilityDetails: request.disabilityDetails,
      monthlySupport: request.monthlySupport,
      supportStartDate: request.supportStartDate ? new Date(request.supportStartDate) : undefined,
      supportEndDate: request.supportEndDate ? new Date(request.supportEndDate) : undefined,
      assessmentMethod: request.assessmentMethod,
      dependencyPercentage: request.dependencyPercentage,
      custodialParentId: request.custodialParentId,
    };
  }

  /**
   * Maps CreateDependencyAssessmentRequest to CreateDependencyAssessmentProps (for aggregate)
   */
  toCreateDependencyAssessmentProps(request: CreateDependencyAssessmentRequest): any {
    return {
      deceasedId: request.deceasedId,
      dependantId: request.dependantId,
      dependencyBasis: request.dependencyBasis,
      isMinor: request.isMinor,
      dependencyLevel: request.dependencyLevel,
      isStudent: request.isStudent,
      hasPhysicalDisability: request.hasPhysicalDisability,
      hasMentalDisability: request.hasMentalDisability,
      requiresOngoingCare: request.requiresOngoingCare,
      disabilityDetails: request.disabilityDetails,
      monthlySupport: request.monthlySupport,
      supportStartDate: request.supportStartDate ? new Date(request.supportStartDate) : undefined,
      supportEndDate: request.supportEndDate ? new Date(request.supportEndDate) : undefined,
      assessmentMethod: request.assessmentMethod,
      dependencyPercentage: request.dependencyPercentage,
      custodialParentId: request.custodialParentId,
    };
  }

  /**
   * Maps AssessFinancialDependencyRequest to domain parameters
   */
  toFinancialDependencyParams(request: AssessFinancialDependencyRequest): {
    monthlySupportEvidence: number;
    dependencyRatio: number;
    dependencyPercentage: number;
    assessmentMethod: string;
  } {
    return {
      monthlySupportEvidence: request.monthlySupportEvidence,
      dependencyRatio: request.dependencyRatio,
      dependencyPercentage: request.dependencyPercentage,
      assessmentMethod: request.assessmentMethod,
    };
  }

  /**
   * Maps FileS26ClaimRequest to domain parameters
   */
  toS26ClaimParams(request: FileS26ClaimRequest): {
    amount: number;
    currency: string;
  } {
    return {
      amount: request.amount,
      currency: request.currency || 'KES',
    };
  }

  /**
   * Maps RecordCourtProvisionRequest to domain parameters
   */
  toCourtProvisionParams(request: RecordCourtProvisionRequest): {
    orderNumber: string;
    approvedAmount: number;
    provisionType: string;
    orderDate: Date;
  } {
    return {
      orderNumber: request.orderNumber,
      approvedAmount: request.approvedAmount,
      provisionType: request.provisionType,
      orderDate: new Date(request.orderDate),
    };
  }

  // --- Domain to Response Mappings ---

  /**
   * Maps LegalDependant entity to DependencyAssessmentResponse
   */
  toDependencyAssessmentResponse(
    dependant: LegalDependant,
    options?: {
      includeNames?: boolean;
      deceasedName?: string;
      dependantName?: string;
      custodialParentName?: string;
    },
  ): DependencyAssessmentResponse {
    const response = new DependencyAssessmentResponse();

    // Basic IDs
    response.id = dependant.id;
    response.deceasedId = dependant.deceasedId;
    response.dependantId = dependant.dependantId;

    // Names if available
    if (options?.includeNames) {
      response.deceasedName = options.deceasedName;
      response.dependantName = options.dependantName;
      response.custodialParentName = options.custodialParentName;
    }

    // Legal basis
    const props = dependant.toJSON();
    response.basisSection = props['basisSection'];
    response.dependencyBasis = dependant.dependencyBasis;
    response.dependencyLevel = dependant.dependencyLevel;
    response.dependencyPercentage = dependant.dependencyPercentage;

    // Personal circumstances
    response.isMinor = dependant.isMinor;
    response.isStudent = dependant.isStudent;
    response.studentUntil = props['studentUntil']?.toISOString();
    response.hasPhysicalDisability = props['hasPhysicalDisability'];
    response.hasMentalDisability = props['hasMentalDisability'];
    response.requiresOngoingCare = dependant.requiresOngoingCare;
    response.disabilityDetails = props['disabilityDetails'];

    // S.26 Claim information
    response.isClaimant = dependant.isClaimant;
    response.claimAmount = props['claimAmount'];
    response.provisionAmount = dependant.provisionAmount;
    response.currency = props['currency'] || 'KES';

    // Court order information
    response.provisionOrderIssued = dependant.hasCourtOrder;
    response.courtOrderReference = props['courtOrderReference'];
    response.courtOrderDate = props['courtOrderDate']?.toISOString();
    response.courtApprovedAmount = dependant.courtApprovedAmount;
    response.provisionOrderNumber = props['provisionOrderNumber'];

    // Financial evidence
    response.monthlySupport = dependant.monthlySupport;
    response.supportStartDate = props['supportStartDate']?.toISOString();
    response.supportEndDate = props['supportEndDate']?.toISOString();
    response.monthlySupportEvidence = props['monthlySupportEvidence'];
    response.dependencyRatio = props['dependencyRatio'];

    // Assessment details
    response.assessmentDate = dependant.assessmentDate.toISOString();
    response.assessmentMethod = props['assessmentMethod'];
    response.ageLimit = props['ageLimit'];

    // Custodial parent
    response.custodialParentId = dependant.custodialParentId;

    // Evidence documents
    response.dependencyProofDocuments = this.mapEvidenceDocuments(
      props['dependencyProofDocuments'],
    );

    // Verification
    response.verifiedByCourtAt = dependant.verifiedByCourtAt?.toISOString();

    // Computed properties
    response.isPriorityDependant = dependant.isPriorityDependant;
    response.qualifiesForS29 = dependant.qualifiesForS29;
    response.s26ClaimStatus = dependant.s26ClaimStatus;
    response.isS29Compliant = dependant['isS29Compliant'] ?? true;

    // Audit
    response.version = props['version'];
    response.createdAt = props['createdAt'].toISOString();
    response.updatedAt = props['updatedAt'].toISOString();

    return response;
  }

  /**
   * Maps multiple LegalDependant entities to DependencyAssessmentResponse array
   */
  toDependencyAssessmentResponseList(
    dependants: LegalDependant[],
    nameMap?: Map<string, { deceasedName?: string; dependantName?: string }>,
  ): DependencyAssessmentResponse[] {
    return dependants.map((dependant) => {
      const options = nameMap?.get(dependant.id);
      return this.toDependencyAssessmentResponse(dependant, {
        includeNames: !!options,
        deceasedName: options?.deceasedName,
        dependantName: options?.dependantName,
      });
    });
  }

  /**
   * Maps domain evidence documents to response DTO
   */
  private mapEvidenceDocuments(documents: any[] | undefined): EvidenceDocumentResponse[] {
    if (!documents || !Array.isArray(documents)) {
      return [];
    }

    return documents.map((doc) => ({
      documentId: doc.documentId,
      evidenceType: doc.evidenceType,
      addedAt: doc.addedAt instanceof Date ? doc.addedAt.toISOString() : new Date().toISOString(),
      verified: doc.verified || false,
      verifiedBy: doc.verifiedBy,
      verifiedAt: doc.verifiedAt instanceof Date ? doc.verifiedAt.toISOString() : doc.verifiedAt,
    }));
  }

  /**
   * Maps domain statistics to DependencyStatistics response
   */
  toDependencyStatistics(stats: any): DependencyStatistics {
    const totalClaim = stats.totalS26ClaimAmount || 0;
    const totalApproved = stats.totalCourtApprovedAmount || 0;

    return {
      totalDependants: stats.totalDependants || 0,
      priorityDependants: stats.totalPriorityDependants || 0,
      conditionalDependants: stats.totalNonPriorityDependants || 0,
      otherDependants: stats.totalOtherDependants || 0,
      s26Claimants: stats.totalS26Claimants || 0,
      withCourtOrders: stats.totalWithCourtOrders || 0,
      minors: stats.totalMinors || 0,
      students: stats.totalStudents || 0,
      withDisabilities: stats.totalDisabled || 0,
      fullDependants: stats.totalFullDependants || 0,
      partialDependants: stats.totalPartialDependants || 0,
      verifiedByCourt: stats.totalVerifiedByCourt || 0,
      totalClaimAmount: totalClaim,
      totalCourtApprovedAmount: totalApproved,
      provisionGap: totalClaim - totalApproved,
      averageDependencyPercentage: stats.averageDependencyPercentage || 0,
    };
  }

  /**
   * Maps LegalDependant to DependantSummary
   */
  toDependantSummary(
    dependant: LegalDependant,
    personInfo?: { name: string; relationship: string },
  ): DependantSummary {
    return {
      dependantId: dependant.dependantId,
      name: personInfo?.name || 'Unknown',
      relationship: personInfo?.relationship || dependant.dependencyBasis,
      dependencyLevel: dependant.dependencyLevel,
      dependencyPercentage: dependant.dependencyPercentage,
      monthlySupport: dependant.monthlySupport,
      hasCourtOrder: dependant.hasCourtOrder,
      courtApprovedAmount: dependant.courtApprovedAmount,
      isCompliant: dependant['isS29Compliant'] ?? false,
    };
  }

  /**
   * Creates DependencyStatusResponse from multiple dependants and statistics
   */
  toDependencyStatusResponse(
    deceasedId: string,
    deceasedName: string,
    dependants: LegalDependant[],
    statistics: any,
    personInfoMap?: Map<string, { name: string; relationship: string }>,
  ): DependencyStatusResponse {
    const response = new DependencyStatusResponse();

    response.deceasedId = deceasedId;
    response.deceasedName = deceasedName;
    response.assessmentDate = new Date().toISOString();

    response.status = this.determineOverallStatus(dependants);
    response.statistics = this.toDependencyStatistics(statistics);
    response.dependants = dependants.map((dependant) =>
      this.toDependantSummary(dependant, personInfoMap?.get(dependant.dependantId)),
    );
    response.compliance = this.determineCompliance(dependants);
    response.nextSteps = this.determineNextSteps(response.compliance, dependants);

    return response;
  }

  // --- Helper Methods ---

  private determineOverallStatus(
    dependants: LegalDependant[],
  ): 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'DISPUTED' {
    if (dependants.length === 0) return 'PENDING';

    const hasPendingClaims = dependants.some((d) => d.s26ClaimStatus === 'PENDING');
    const hasUnverified = dependants.some((d) => !d.toJSON()['verifiedByCourtAt']);
    const hasDisputes = dependants.some(
      (d) => d.s26ClaimStatus === 'DENIED' || d.dependencyPercentage === 0,
    );

    if (hasDisputes) return 'DISPUTED';
    if (hasPendingClaims || hasUnverified) return 'IN_PROGRESS';

    return 'COMPLETE';
  }

  private determineCompliance(dependants: LegalDependant[]): {
    s29Compliant: boolean;
    s26ClaimsResolved: boolean;
    courtOrdersFiled: boolean;
    evidenceComplete: boolean;
    issues: ComplianceIssue[];
  } {
    const issues: ComplianceIssue[] = [];

    // Check S.29 compliance
    const nonCompliantS29 = dependants.filter((d) => !d.toJSON()['isS29Compliant']);
    const s29Compliant = nonCompliantS29.length === 0;
    if (!s29Compliant) {
      issues.push({
        code: 'S29_NON_COMPLIANT',
        message: `${nonCompliantS29.length} dependants do not meet Section 29 requirements`,
        severity: 'CRITICAL',
      });
    }

    // Check S.26 claims resolution
    const pendingClaims = dependants.filter((d) => d.s26ClaimStatus === 'PENDING');
    const s26ClaimsResolved = pendingClaims.length === 0;
    if (!s26ClaimsResolved) {
      issues.push({
        code: 'PENDING_S26_CLAIMS',
        message: `${pendingClaims.length} S.26 claims are still pending resolution`,
        severity: 'WARNING',
      });
    }

    // Check court orders for claimants
    const claimantsWithoutOrders = dependants.filter((d) => d.isClaimant && !d.hasCourtOrder);
    const courtOrdersFiled = claimantsWithoutOrders.length === 0;
    if (!courtOrdersFiled) {
      issues.push({
        code: 'MISSING_COURT_ORDERS',
        message: `${claimantsWithoutOrders.length} claimants lack required court orders`,
        severity: 'CRITICAL',
      });
    }

    // Check evidence completeness
    const withoutEvidence = dependants.filter((d) => {
      const docs = d.toJSON()['dependencyProofDocuments'];
      return !d.isPriorityDependant && (!docs || docs.length === 0);
    });

    const evidenceComplete = withoutEvidence.length === 0;
    if (!evidenceComplete) {
      issues.push({
        code: 'MISSING_EVIDENCE',
        message: `${withoutEvidence.length} non-priority dependants lack supporting evidence`,
        severity: 'WARNING',
      });
    }

    return {
      s29Compliant,
      s26ClaimsResolved,
      courtOrdersFiled,
      evidenceComplete,
      issues,
    };
  }

  private determineNextSteps(
    compliance: { issues: ComplianceIssue[] },
    dependants: LegalDependant[],
  ): string[] {
    const steps: string[] = [];

    if (compliance.issues.length > 0) {
      steps.push('Resolve compliance issues listed above.');
    }

    const minorsWithoutCustodial = dependants.filter((d) => d.isMinor && !d.custodialParentId);
    if (minorsWithoutCustodial.length > 0) {
      steps.push(`Assign custodial parents for ${minorsWithoutCustodial.length} minor(s)`);
    }

    const studentsWithoutEndDate = dependants.filter(
      (d) => d.isStudent && !d.isMinor && !d.toJSON()['studentUntil'],
    );
    if (studentsWithoutEndDate.length > 0) {
      steps.push(`Add student end dates for ${studentsWithoutEndDate.length} student(s)`);
    }

    const today = new Date();
    const expiredSupport = dependants.filter((d) => {
      const end = d.toJSON()['supportEndDate'];
      return end && new Date(end) < today;
    });

    if (expiredSupport.length > 0) {
      steps.push(`Review ${expiredSupport.length} dependant(s) with expired support`);
    }

    if (steps.length === 0) {
      steps.push('Proceed to estate distribution planning.');
    }

    return steps;
  }

  mapRequestEvidenceToDomain(evidence: EvidenceDocumentDto[]): any[] {
    return evidence.map((doc) => ({
      documentId: doc.documentId,
      evidenceType: doc.evidenceType,
      addedAt: doc.addedAt ? new Date(doc.addedAt) : new Date(),
      verified: false,
    }));
  }

  mapSupportingDocumentsToDomain(docs: SupportingDocumentDto[]): any[] {
    return docs.map((doc) => ({
      documentId: doc.documentId,
      documentType: doc.documentType,
      description: doc.description,
      documentDate: doc.documentDate ? new Date(doc.documentDate) : undefined,
      addedAt: new Date(),
      verified: false,
    }));
  }
}
