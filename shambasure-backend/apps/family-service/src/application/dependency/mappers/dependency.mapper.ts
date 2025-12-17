// application/dependency/mappers/dependency.mapper.ts
import { Injectable } from '@nestjs/common';

import { DependencyAssessmentAggregate } from '../../../domain/aggregates/dependency-assessment.aggregate';
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
    response.basisSection = dependant['basisSection']; // Using bracket notation for private props
    response.dependencyBasis = dependant.dependencyBasis;
    response.dependencyLevel = dependant.dependencyLevel;
    response.dependencyPercentage = dependant.dependencyPercentage;

    // Personal circumstances
    response.isMinor = dependant.isMinor;
    response.isStudent = dependant.isStudent;
    response.studentUntil = dependant['studentUntil']?.toISOString();
    response.hasPhysicalDisability = dependant['hasPhysicalDisability'];
    response.hasMentalDisability = dependant['hasMentalDisability'];
    response.requiresOngoingCare = dependant.requiresOngoingCare;
    response.disabilityDetails = dependant['disabilityDetails'];

    // S.26 Claim information
    response.isClaimant = dependant.isClaimant;
    response.claimAmount = dependant['claimAmount'];
    response.provisionAmount = dependant.provisionAmount;
    response.currency = dependant['currency'] || 'KES';

    // Court order information
    response.provisionOrderIssued = dependant.hasCourtOrder;
    response.courtOrderReference = dependant['courtOrderReference'];
    response.courtOrderDate = dependant['courtOrderDate']?.toISOString();
    response.courtApprovedAmount = dependant.courtApprovedAmount;
    response.provisionOrderNumber = dependant['provisionOrderNumber'];

    // Financial evidence
    response.monthlySupport = dependant.monthlySupport;
    response.supportStartDate = dependant['supportStartDate']?.toISOString();
    response.supportEndDate = dependant['supportEndDate']?.toISOString();
    response.monthlySupportEvidence = dependant['monthlySupportEvidence'];
    response.dependencyRatio = dependant['dependencyRatio'];

    // Assessment details
    response.assessmentDate = dependant.assessmentDate.toISOString();
    response.assessmentMethod = dependant['assessmentMethod'];
    response.ageLimit = dependant['ageLimit'];

    // Custodial parent
    response.custodialParentId = dependant.custodialParentId;

    // Evidence documents
    response.dependencyProofDocuments = this.mapEvidenceDocuments(
      dependant['dependencyProofDocuments'],
    );

    // Verification
    response.verifiedByCourtAt = dependant.verifiedByCourtAt?.toISOString();

    // Computed properties
    response.isPriorityDependant = dependant.isPriorityDependant;
    response.qualifiesForS29 = dependant.qualifiesForS29;
    response.s26ClaimStatus = dependant.s26ClaimStatus;
    response.isS29Compliant = dependant['isS29Compliant'];

    // Audit
    response.version = dependant['version'];
    response.createdAt = dependant['createdAt'].toISOString();
    response.updatedAt = dependant['updatedAt'].toISOString();

    return response;
  }

  /**
   * Maps DependencyAssessmentAggregate to DependencyAssessmentResponse
   */
  toDependencyAssessmentResponseFromAggregate(
    aggregate: DependencyAssessmentAggregate,
    options?: {
      includeNames?: boolean;
      deceasedName?: string;
      dependantName?: string;
      custodialParentName?: string;
    },
  ): DependencyAssessmentResponse {
    const response = new DependencyAssessmentResponse();

    // Basic IDs
    response.id = aggregate.id;
    response.deceasedId = aggregate.deceasedId;
    response.dependantId = aggregate.dependantId;

    // Names if available
    if (options?.includeNames) {
      response.deceasedName = options.deceasedName;
      response.dependantName = options.dependantName;
      response.custodialParentName = options.custodialParentName;
    }

    // Legal basis
    response.basisSection = aggregate['basisSection'];
    response.dependencyBasis = aggregate.dependencyBasis;
    response.dependencyLevel = aggregate.dependencyLevel;
    response.dependencyPercentage = aggregate.dependencyPercentage;

    // Personal circumstances
    response.isMinor = aggregate.isMinor;
    response.isStudent = aggregate.isStudent;
    response.studentUntil = aggregate['studentUntil']?.toISOString();
    response.hasPhysicalDisability = aggregate['hasPhysicalDisability'];
    response.hasMentalDisability = aggregate['hasMentalDisability'];
    response.requiresOngoingCare = aggregate.requiresOngoingCare;
    response.disabilityDetails = aggregate['disabilityDetails'];

    // S.26 Claim information
    response.isClaimant = aggregate.isClaimant;
    response.claimAmount = aggregate['claimAmount'];
    response.provisionAmount = aggregate.provisionAmount;
    response.currency = aggregate['currency'] || 'KES';

    // Court order information
    response.provisionOrderIssued = aggregate.hasCourtOrder;
    response.courtOrderReference = aggregate['courtOrderReference'];
    response.courtOrderDate = aggregate['courtOrderDate']?.toISOString();
    response.courtApprovedAmount = aggregate.courtApprovedAmount;
    response.provisionOrderNumber = aggregate['provisionOrderNumber'];

    // Financial evidence
    response.monthlySupport = aggregate.monthlySupport;
    response.supportStartDate = aggregate['supportStartDate']?.toISOString();
    response.supportEndDate = aggregate['supportEndDate']?.toISOString();
    response.monthlySupportEvidence = aggregate.monthlySupportEvidence;
    response.dependencyRatio = aggregate.financialDependencyRatio;

    // Assessment details
    response.assessmentDate = aggregate.assessmentDate.toISOString();
    response.assessmentMethod = aggregate['assessmentMethod'];
    response.ageLimit = aggregate['ageLimit'];

    // Custodial parent
    response.custodialParentId = aggregate.custodialParentId;

    // Evidence documents
    response.dependencyProofDocuments = this.mapEvidenceDocuments(
      aggregate['dependencyProofDocuments'],
    );

    // Verification
    response.verifiedByCourtAt = aggregate.verifiedByCourtAt?.toISOString();

    // Computed properties
    response.isPriorityDependant = aggregate.isPriorityDependant;
    response.qualifiesForS29 = aggregate.qualifiesForS29;
    response.s26ClaimStatus = aggregate.s26ClaimStatus;
    response.isS29Compliant = aggregate.isS29Compliant;

    // Audit
    response.version = aggregate.version;
    response.createdAt = aggregate.createdAt.toISOString();
    response.updatedAt = aggregate.updatedAt.toISOString();

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
      addedAt: doc.addedAt?.toISOString() || new Date().toISOString(),
      verified: doc.verified || false,
      verifiedBy: doc.verifiedBy,
      verifiedAt: doc.verifiedAt?.toISOString(),
    }));
  }

  /**
   * Maps domain statistics to DependencyStatistics response
   */
  toDependencyStatistics(stats: any): DependencyStatistics {
    return {
      totalDependants: stats.totalDependants || 0,
      priorityDependants: stats.totalPriorityDependants || 0,
      nonPriorityDependants: stats.totalNonPriorityDependants || 0,
      s26Claimants: stats.totalS26Claimants || 0,
      withCourtOrders: stats.totalWithCourtOrders || 0,
      minors: stats.totalMinors || 0,
      students: stats.totalStudents || 0,
      withDisabilities: stats.totalDisabled || 0,
      fullDependants: stats.totalFullDependants || 0,
      partialDependants: stats.totalPartialDependants || 0,
      verifiedByCourt: stats.totalVerifiedByCourt || 0,
      totalClaimAmount: stats.totalS26ClaimAmount || 0,
      totalCourtApprovedAmount: stats.totalCourtApprovedAmount || 0,
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

    // Determine overall status
    response.status = this.determineOverallStatus(dependants);

    // Map statistics
    response.statistics = this.toDependencyStatistics(statistics);

    // Map dependants to summaries
    response.dependants = dependants.map((dependant) =>
      this.toDependantSummary(dependant, personInfoMap?.get(dependant.dependantId)),
    );

    // Determine compliance
    response.compliance = this.determineCompliance(dependants);

    // Determine next steps
    response.nextSteps = this.determineNextSteps(response.compliance, dependants);

    return response;
  }

  // --- Helper Methods ---

  /**
   * Determines overall dependency assessment status
   */
  private determineOverallStatus(
    dependants: LegalDependant[],
  ): 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'DISPUTED' {
    if (dependants.length === 0) return 'PENDING';

    const hasPendingClaims = dependants.some((d) => d.s26ClaimStatus === 'PENDING');
    const hasUnverified = dependants.some((d) => !d['verifiedByCourtAt']);
    const hasDisputes = dependants.some(
      (d) => d.s26ClaimStatus === 'DENIED' || d.dependencyPercentage === 0,
    );

    if (hasDisputes) return 'DISPUTED';
    if (hasPendingClaims || hasUnverified) return 'IN_PROGRESS';

    return 'COMPLETE';
  }

  /**
   * Determines compliance with LSA requirements
   */
  private determineCompliance(dependants: LegalDependant[]): {
    s29Compliant: boolean;
    s26ClaimsResolved: boolean;
    courtOrdersFiled: boolean;
    evidenceComplete: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check S.29 compliance
    const nonCompliantS29 = dependants.filter((d) => !d['isS29Compliant']);
    const s29Compliant = nonCompliantS29.length === 0;
    if (!s29Compliant) {
      issues.push(`${nonCompliantS29.length} dependants are not S.29 compliant`);
    }

    // Check S.26 claims resolution
    const pendingClaims = dependants.filter((d) => d.s26ClaimStatus === 'PENDING');
    const s26ClaimsResolved = pendingClaims.length === 0;
    if (!s26ClaimsResolved) {
      issues.push(`${pendingClaims.length} S.26 claims are pending`);
    }

    // Check court orders for claimants
    const claimantsWithoutOrders = dependants.filter((d) => d.isClaimant && !d.hasCourtOrder);
    const courtOrdersFiled = claimantsWithoutOrders.length === 0;
    if (!courtOrdersFiled) {
      issues.push(`${claimantsWithoutOrders.length} claimants lack court orders`);
    }

    // Check evidence completeness
    const withoutEvidence = dependants.filter(
      (d) =>
        !d.isPriorityDependant &&
        (!d['dependencyProofDocuments'] || d['dependencyProofDocuments'].length === 0),
    );
    const evidenceComplete = withoutEvidence.length === 0;
    if (!evidenceComplete) {
      issues.push(`${withoutEvidence.length} non-priority dependants lack evidence`);
    }

    return {
      s29Compliant,
      s26ClaimsResolved,
      courtOrdersFiled,
      evidenceComplete,
      issues,
    };
  }

  /**
   * Determines next steps based on current status
   */
  private determineNextSteps(
    compliance: { issues: string[] },
    dependants: LegalDependant[],
  ): string[] {
    const steps: string[] = [];

    if (compliance.issues.length > 0) {
      steps.push('Address the following compliance issues:');
      steps.push(...compliance.issues.map((issue) => `  - ${issue}`));
    }

    // Check for minors without custodial parents
    const minorsWithoutCustodial = dependants.filter((d) => d.isMinor && !d.custodialParentId);
    if (minorsWithoutCustodial.length > 0) {
      steps.push(`Assign custodial parents for ${minorsWithoutCustodial.length} minor(s)`);
    }

    // Check for students without end dates
    const studentsWithoutEndDate = dependants.filter(
      (d) => d.isStudent && !d.isMinor && !d['studentUntil'],
    );
    if (studentsWithoutEndDate.length > 0) {
      steps.push(`Add student end dates for ${studentsWithoutEndDate.length} student(s)`);
    }

    // Check for expired support
    const today = new Date();
    const expiredSupport = dependants.filter(
      (d) => d['supportEndDate'] && new Date(d['supportEndDate']) < today,
    );
    if (expiredSupport.length > 0) {
      steps.push(`Review ${expiredSupport.length} dependant(s) with expired support`);
    }

    if (steps.length === 0) {
      steps.push('No further action required. Dependency assessment is complete.');
    }

    return steps;
  }

  /**
   * Maps evidence documents from request to domain format
   */
  mapRequestEvidenceToDomain(evidence: EvidenceDocumentDto[]): any[] {
    return evidence.map((doc) => ({
      documentId: doc.documentId,
      evidenceType: doc.evidenceType,
      addedAt: doc.addedAt ? new Date(doc.addedAt) : new Date(),
      verified: false,
    }));
  }

  /**
   * Maps supporting documents from S26 claim request
   */
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

  /**
   * Creates a partial update object from request
   */
  toPartialUpdateProps(request: any): Record<string, any> {
    const props: Record<string, any> = {};

    // Map date strings to Date objects
    const dateFields = [
      'supportStartDate',
      'supportEndDate',
      'studentUntil',
      'courtOrderDate',
      'verifiedByCourtAt',
    ];

    Object.keys(request).forEach((key) => {
      if (request[key] !== undefined) {
        if (dateFields.includes(key) && request[key]) {
          props[key] = new Date(request[key]);
        } else {
          props[key] = request[key];
        }
      }
    });

    return props;
  }
}
