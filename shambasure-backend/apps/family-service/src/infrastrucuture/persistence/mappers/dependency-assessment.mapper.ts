// domain/mappers/dependency-assessment.mapper.ts
import { Injectable } from '@nestjs/common';
import { DependencyLevel, KenyanLawSection } from '@prisma/client';

import { DependencyAssessmentAggregate } from '../../../domain/aggregates/dependency-assessment.aggregate';
import { DomainEvent } from '../../../domain/base/domain-event';
import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import {
  DependencyRelationship,
  LegalDependant,
  S26ClaimStatus,
} from '../../../domain/entities/legal-dependant.entity';
import { DependencyAssessment } from '../../../domain/value-objects/dependency/dependency-assessment.vo';
import { DisabilityStatus } from '../../../domain/value-objects/dependency/disability-status.vo';
import { SupportEvidence } from '../../../domain/value-objects/dependency/support-evidence.vo';
import { KenyanMoney } from '../../../domain/value-objects/financial/kenyan-money.vo';
import { CourtOrder } from '../../../domain/value-objects/legal/court-order.vo';

/**
 * Database Models (Prisma schema representation)
 */
export interface PersistenceDependencyAssessment {
  id: string;
  deceasedId: string;
  deceasedName: string;
  dateOfDeath: Date;
  monthlyIncome?: number;
  totalEstateValue?: number;
  totalDependants: number;
  totalDependencyPercentage: number;
  lastCalculatedAt?: Date;
  isFinalized: boolean;
  finalizedAt?: Date;
  finalizedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  version: number;
}

export interface PersistenceLegalDependant {
  id: string;
  assessmentId: string;
  deceasedId: string;
  dependantId: string;
  relationship: DependencyRelationship;
  basisSection: KenyanLawSection;

  // Dependency Assessment (Value Object)
  dependencyLevel: DependencyLevel;
  dependencyPercentage: number;
  assessmentMethod?: string;
  assessmentDate: Date;

  // Support Evidence (Value Object)
  monthlySupport?: number;
  supportStartDate?: Date;
  supportEndDate?: Date;

  // Disability Status (Value Object)
  hasPhysicalDisability?: boolean;
  hasMentalDisability?: boolean;
  requiresOngoingCare?: boolean;
  disabilityDetails?: string;
  medicalCertificateId?: string;

  // Demographics
  isMinor: boolean;
  currentAge?: number;
  isStudent: boolean;
  studentUntil?: Date;
  ageLimit?: number;

  // Custodial Parent
  custodialParentId?: string;

  // S.26 Court Provision
  isS26Claimant: boolean;
  s26ClaimAmount?: number;
  s26ClaimStatus: S26ClaimStatus;
  s26CourtOrder?: any; // JSON field
  s26ProvisionAmount?: number;

  // Evidence & Verification
  evidenceDocuments: string[];
  verifiedAt?: Date;
  verifiedBy?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  version: number;
}

export interface PersistenceGiftInterVivos {
  id: string;
  assessmentId: string;
  giftId: string;
  recipientId: string;
  valueAtGiftTime: number;
  dateOfGift: Date;
  description: string;
  isSubjectToHotchpot: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PersistenceDistributionCalculation {
  id: string;
  assessmentId: string;
  dependantId: string;
  dependantName: string;
  relationship: DependencyRelationship;
  dependencyPercentage: number;
  grossEntitlement: number;
  hotchpotDeduction: number;
  netEntitlement: number;
  entitlementBasis: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistenceDomainEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: any;
  version: number;
  occurredAt: Date;
  createdAt: Date;
}

/**
 * Mapper for converting between Domain and Persistence models
 *
 * KENYAN LAW CONSIDERATIONS:
 * - Must preserve all legal data points for court evidence
 * - Value objects must be serialized/deserialized accurately
 * - Timestamps must be preserved for audit trail
 * - Soft delete must be tracked for legal retention
 */
@Injectable()
export class DependencyAssessmentMapper {
  // ============================================================================
  // DOMAIN -> PERSISTENCE (For Saving)
  // ============================================================================

  /**
   * Map DependencyAssessmentAggregate to persistence model
   */
  toPersistence(aggregate: DependencyAssessmentAggregate): {
    assessment: PersistenceDependencyAssessment;
    dependants: PersistenceLegalDependant[];
    gifts: PersistenceGiftInterVivos[];
    distributionCalculations: PersistenceDistributionCalculation[];
    events: PersistenceDomainEvent[];
  } {
    const props = aggregate.toJSON();

    // Map assessment
    const assessment: PersistenceDependencyAssessment = {
      id: props.id,
      deceasedId: props.deceasedInfo.deceasedId,
      deceasedName: props.deceasedInfo.fullName,
      dateOfDeath: new Date(props.deceasedInfo.dateOfDeath),
      monthlyIncome: props.deceasedInfo.monthlyIncome,
      totalEstateValue: props.deceasedInfo.totalEstateValue,
      totalDependants: props.totalDependants,
      totalDependencyPercentage: props.totalDependencyPercentage,
      lastCalculatedAt: props.lastCalculatedAt ? new Date(props.lastCalculatedAt) : undefined,
      isFinalized: props.isFinalized,
      finalizedAt: props.finalizedAt ? new Date(props.finalizedAt) : undefined,
      finalizedBy: props.finalizedBy,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
      deletedAt: props.deletedAt ? new Date(props.deletedAt) : undefined,
      version: props.version,
    };

    // Map dependants
    const dependants = props.dependants.map((d) => this.mapDependantToPersistence(d, props.id));

    // Map gifts inter vivos
    const gifts = props.giftsInterVivos.map((g) => this.mapGiftToPersistence(g, props.id));

    // Map distribution calculations
    const distributionCalculations =
      props.distributionCalculations?.map((dc) =>
        this.mapDistributionToPersistence(dc, props.id),
      ) || [];

    // Map domain events
    const events = aggregate
      .getUncommittedEvents()
      .map((event) => this.mapEventToPersistence(event, props.id));

    return {
      assessment,
      dependants,
      gifts,
      distributionCalculations,
      events,
    };
  }

  /**
   * Map LegalDependant entity to persistence model
   */
  private mapDependantToPersistence(
    dependant: any, // Using any to avoid complex type mapping
    assessmentId: string,
  ): PersistenceLegalDependant {
    return {
      id: dependant.id,
      assessmentId,
      deceasedId: dependant.deceasedId,
      dependantId: dependant.dependantId,
      relationship: dependant.relationship,
      basisSection: dependant.basisSection,

      // Dependency Assessment (Value Object)
      dependencyLevel: dependant.assessment.dependencyLevel,
      dependencyPercentage: dependant.assessment.dependencyPercentage,
      assessmentMethod: dependant.assessment.assessmentMethod,
      assessmentDate: new Date(dependant.assessment.assessmentDate),

      // Support Evidence (Value Object)
      monthlySupport: dependant.supportEvidence?.monthlySupport?.amount,
      supportStartDate: dependant.supportEvidence?.supportStartDate
        ? new Date(dependant.supportEvidence.supportStartDate)
        : undefined,
      supportEndDate: dependant.supportEvidence?.supportEndDate
        ? new Date(dependant.supportEvidence.supportEndDate)
        : undefined,

      // Disability Status (Value Object)
      hasPhysicalDisability: dependant.disabilityStatus?.hasPhysicalDisability,
      hasMentalDisability: dependant.disabilityStatus?.hasMentalDisability,
      requiresOngoingCare: dependant.disabilityStatus?.requiresOngoingCare,
      disabilityDetails: dependant.disabilityStatus?.disabilityDetails,
      medicalCertificateId: dependant.disabilityStatus?.medicalCertificateId,

      // Demographics
      isMinor: dependant.isMinor,
      currentAge: dependant.currentAge,
      isStudent: dependant.isStudent,
      studentUntil: dependant.studentUntil ? new Date(dependant.studentUntil) : undefined,
      ageLimit: dependant.ageLimit,

      // Custodial Parent
      custodialParentId: dependant.custodialParentId,

      // S.26 Court Provision
      isS26Claimant: dependant.isS26Claimant,
      s26ClaimAmount: dependant.s26ClaimAmount?.amount,
      s26ClaimStatus: dependant.s26ClaimStatus,
      s26CourtOrder: dependant.s26CourtOrder
        ? {
            orderNumber: dependant.s26CourtOrder.orderNumber,
            courtStation: dependant.s26CourtOrder.courtStation,
            orderDate: dependant.s26CourtOrder.orderDate,
            orderType: dependant.s26CourtOrder.orderType,
            createdAt: dependant.s26CourtOrder.createdAt,
          }
        : undefined,
      s26ProvisionAmount: dependant.s26ProvisionAmount?.amount,

      // Evidence & Verification
      evidenceDocuments: dependant.evidenceDocuments,
      verifiedAt: dependant.verifiedAt ? new Date(dependant.verifiedAt) : undefined,
      verifiedBy: dependant.verifiedBy,

      // Metadata
      createdAt: new Date(dependant.createdAt),
      updatedAt: new Date(dependant.updatedAt),
      deletedAt: dependant.deletedAt ? new Date(dependant.deletedAt) : undefined,
      version: dependant.version,
    };
  }

  /**
   * Map GiftInterVivos to persistence model
   */
  private mapGiftToPersistence(gift: any, assessmentId: string): PersistenceGiftInterVivos {
    return {
      id: gift.giftId,
      assessmentId,
      giftId: gift.giftId,
      recipientId: gift.recipientId,
      valueAtGiftTime: gift.valueAtGiftTime,
      dateOfGift: new Date(gift.dateOfGift),
      description: gift.description,
      isSubjectToHotchpot: gift.isSubjectToHotchpot,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Map DistributionCalculation to persistence model
   */
  private mapDistributionToPersistence(
    calculation: any,
    assessmentId: string,
  ): PersistenceDistributionCalculation {
    return {
      id: `${assessmentId}_${calculation.dependantId}`,
      assessmentId,
      dependantId: calculation.dependantId,
      dependantName: calculation.dependantName,
      relationship: calculation.relationship,
      dependencyPercentage: calculation.dependencyPercentage,
      grossEntitlement: calculation.grossEntitlement,
      hotchpotDeduction: calculation.hotchpotDeduction,
      netEntitlement: calculation.netEntitlement,
      entitlementBasis: calculation.entitlementBasis,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Map DomainEvent to persistence model
   */
  private mapEventToPersistence(event: DomainEvent, aggregateId: string): PersistenceDomainEvent {
    // Get the event payload from toJSON() method
    const eventJson = event.toJSON();

    return {
      id: `${aggregateId}_${event.version}_${event.occurredAt.getTime()}`,
      aggregateId,
      aggregateType: event.aggregateType,
      eventType: event.getEventType(),
      eventData: eventJson.payload, // Use payload from toJSON()
      version: event.version, // Use version property
      occurredAt: event.occurredAt,
      createdAt: new Date(),
    };
  }

  // ============================================================================
  // PERSISTENCE -> DOMAIN (For Loading)
  // ============================================================================

  /**
   * Map persistence data to DependencyAssessmentAggregate
   */
  toDomain(
    assessmentData: PersistenceDependencyAssessment,
    dependantsData: PersistenceLegalDependant[],
    giftsData: PersistenceGiftInterVivos[],
    calculationsData?: PersistenceDistributionCalculation[],
  ): DependencyAssessmentAggregate {
    // Map deceased info
    const deceasedInfo = {
      deceasedId: assessmentData.deceasedId,
      fullName: assessmentData.deceasedName,
      dateOfDeath: assessmentData.dateOfDeath,
      monthlyIncome: assessmentData.monthlyIncome,
      totalEstateValue: assessmentData.totalEstateValue,
    };

    // Map dependants
    const dependantsMap = new Map<string, LegalDependant>();
    dependantsData.forEach((d) => {
      const dependant = this.mapDependantFromPersistence(d);
      dependantsMap.set(d.dependantId, dependant);
    });

    // Map gifts
    const giftsMap = new Map<string, any>();
    giftsData.forEach((g) => {
      giftsMap.set(g.giftId, {
        giftId: g.giftId,
        recipientId: g.recipientId,
        valueAtGiftTime: g.valueAtGiftTime,
        dateOfGift: g.dateOfGift,
        description: g.description,
        isSubjectToHotchpot: g.isSubjectToHotchpot,
      });
    });

    // Map distribution calculations
    const distributionCalculations = calculationsData?.map((dc) => ({
      dependantId: dc.dependantId,
      dependantName: dc.dependantName,
      relationship: dc.relationship,
      dependencyPercentage: dc.dependencyPercentage,
      grossEntitlement: dc.grossEntitlement,
      hotchpotDeduction: dc.hotchpotDeduction,
      netEntitlement: dc.netEntitlement,
      entitlementBasis: dc.entitlementBasis,
    }));

    // Create aggregate props
    const props = {
      deceasedInfo,
      dependants: dependantsMap,
      giftsInterVivos: giftsMap,
      totalDependants: assessmentData.totalDependants,
      totalDependencyPercentage: assessmentData.totalDependencyPercentage,
      lastCalculatedAt: assessmentData.lastCalculatedAt,
      distributionCalculations,
      isFinalized: assessmentData.isFinalized,
      finalizedAt: assessmentData.finalizedAt,
      finalizedBy: assessmentData.finalizedBy
        ? new UniqueEntityID(assessmentData.finalizedBy)
        : undefined,
    };

    // Recreate aggregate
    return DependencyAssessmentAggregate.fromPersistence(
      assessmentData.id,
      props,
      assessmentData.createdAt,
    );
  }

  /**
   * Map persistence model to LegalDependant entity
   */
  private mapDependantFromPersistence(data: PersistenceLegalDependant): LegalDependant {
    // Build dependency assessment value object
    const assessment = DependencyAssessment.create({
      dependencyLevel: data.dependencyLevel,
      dependencyPercentage: data.dependencyPercentage,
      assessmentMethod: data.assessmentMethod || 'UNKNOWN', // Provide default
      assessmentDate: data.assessmentDate,
    });

    // Build support evidence value object
    let supportEvidence: SupportEvidence | undefined;
    if (data.monthlySupport !== undefined) {
      supportEvidence = SupportEvidence.create({
        monthlySupport: KenyanMoney.create(data.monthlySupport),
        supportStartDate: data.supportStartDate ?? new Date(),
        supportEndDate: data.supportEndDate,
      });
    }

    // Build disability status value object
    let disabilityStatus: DisabilityStatus | undefined;
    if (
      data.hasPhysicalDisability !== undefined ||
      data.hasMentalDisability !== undefined ||
      data.requiresOngoingCare !== undefined
    ) {
      disabilityStatus = DisabilityStatus.create({
        hasPhysicalDisability: data.hasPhysicalDisability ?? false,
        hasMentalDisability: data.hasMentalDisability ?? false,
        requiresOngoingCare: data.requiresOngoingCare ?? false,
        disabilityDetails: data.disabilityDetails,
        medicalCertificateId: data.medicalCertificateId,
      });
    }

    // Build court order value object
    let s26CourtOrder: CourtOrder | undefined;
    if (data.s26CourtOrder) {
      s26CourtOrder = CourtOrder.create({
        orderNumber: data.s26CourtOrder.orderNumber,
        courtStation: data.s26CourtOrder.courtStation,
        orderDate: new Date(data.s26CourtOrder.orderDate),
        orderType: data.s26CourtOrder.orderType,
      });
    }

    // Build money value objects
    let s26ClaimAmount: KenyanMoney | undefined;
    if (data.s26ClaimAmount !== undefined) {
      s26ClaimAmount = KenyanMoney.create(data.s26ClaimAmount);
    }

    let s26ProvisionAmount: KenyanMoney | undefined;
    if (data.s26ProvisionAmount !== undefined) {
      s26ProvisionAmount = KenyanMoney.create(data.s26ProvisionAmount);
    }

    // Build dependant props
    const props = {
      deceasedId: new UniqueEntityID(data.deceasedId),
      dependantId: new UniqueEntityID(data.dependantId),
      relationship: data.relationship,
      basisSection: data.basisSection,
      assessment,
      supportEvidence,
      disabilityStatus,
      isMinor: data.isMinor,
      currentAge: data.currentAge,
      isStudent: data.isStudent,
      studentUntil: data.studentUntil,
      ageLimit: data.ageLimit,
      custodialParentId: data.custodialParentId
        ? new UniqueEntityID(data.custodialParentId)
        : undefined,
      isS26Claimant: data.isS26Claimant,
      s26ClaimAmount,
      s26ClaimStatus: data.s26ClaimStatus,
      s26CourtOrder,
      s26ProvisionAmount,
      evidenceDocuments: data.evidenceDocuments,
      verifiedAt: data.verifiedAt,
      verifiedBy: data.verifiedBy ? new UniqueEntityID(data.verifiedBy) : undefined,
    };

    // Recreate dependant entity
    return LegalDependant.fromPersistence(data.id, props, data.createdAt);
  }

  // ============================================================================
  // QUERY RESULT MAPPING (Projections)
  // ============================================================================

  /**
   * Map to AssessmentSummary projection
   */
  toAssessmentSummary(
    assessment: PersistenceDependencyAssessment,
    dependantsCount: number,
    priorityDependantsCount: number,
    s26ClaimantsCount: number,
  ): any {
    return {
      id: assessment.id,
      deceasedId: assessment.deceasedId,
      deceasedName: assessment.deceasedName,
      dateOfDeath: assessment.dateOfDeath,
      totalDependants: dependantsCount,
      priorityDependants: priorityDependantsCount,
      s26Claimants: s26ClaimantsCount,
      isFinalized: assessment.isFinalized,
      finalizedAt: assessment.finalizedAt,
      lastCalculatedAt: assessment.lastCalculatedAt,
      totalEstateValue: assessment.totalEstateValue,
      totalHotchpotValue: 0, // Would need to calculate from gifts
      nextActionDue: this.calculateNextActionDue(assessment),
      nextActionType: this.determineNextActionType(assessment),
    };
  }

  /**
   * Map to DependantSummary projection
   */
  toDependantSummary(dependant: PersistenceLegalDependant): any {
    return {
      id: dependant.id,
      dependantId: dependant.dependantId,
      dependantName: '', // Would need to fetch from family service
      relationship: dependant.relationship,
      dependencyPercentage: dependant.dependencyPercentage,
      isMinor: dependant.isMinor,
      isStudent: dependant.isStudent,
      hasDisability: dependant.hasPhysicalDisability || dependant.hasMentalDisability,
      isPriorityDependant: this.isPriorityDependant(dependant.relationship),
      isS26Claimant: dependant.isS26Claimant,
      s26ClaimStatus: dependant.s26ClaimStatus,
      evidenceVerified: !!dependant.verifiedAt,
    };
  }

  /**
   * Map to DistributionReport
   */
  toDistributionReport(
    assessment: PersistenceDependencyAssessment,
    calculations: PersistenceDistributionCalculation[],
  ): any {
    const totalDistribution = calculations.reduce((sum, calc) => sum + calc.netEntitlement, 0);
    const remainingEstate = (assessment.totalEstateValue || 0) - totalDistribution;

    return {
      generatedAt: new Date(),
      assessmentId: assessment.id,
      deceasedName: assessment.deceasedName,
      totalEstateValue: assessment.totalEstateValue || 0,
      hotchpotTotal: 0, // Would need to calculate from gifts
      totalGiftsValue: 0, // Would need to calculate from gifts
      distributionCalculations: calculations.map((calc) => ({
        dependantId: calc.dependantId,
        dependantName: calc.dependantName,
        relationship: calc.relationship,
        dependencyPercentage: calc.dependencyPercentage,
        grossEntitlement: calc.grossEntitlement,
        hotchpotDeduction: calc.hotchpotDeduction,
        netEntitlement: calc.netEntitlement,
        entitlementBasis: calc.entitlementBasis,
      })),
      summary: {
        totalDependants: calculations.length,
        totalDistribution,
        remainingEstate,
        averageEntitlement: calculations.length > 0 ? totalDistribution / calculations.length : 0,
        highestEntitlement:
          calculations.length > 0 ? Math.max(...calculations.map((c) => c.netEntitlement)) : 0,
        lowestEntitlement:
          calculations.length > 0 ? Math.min(...calculations.map((c) => c.netEntitlement)) : 0,
      },
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private isPriorityDependant(relationship: DependencyRelationship): boolean {
    return [
      DependencyRelationship.SPOUSE,
      DependencyRelationship.CHILD,
      DependencyRelationship.ADOPTED_CHILD,
    ].includes(relationship);
  }

  private calculateNextActionDue(assessment: PersistenceDependencyAssessment): Date | undefined {
    if (assessment.isFinalized) {
      return undefined;
    }

    // Add 30 days from creation for action
    const nextAction = new Date(assessment.createdAt);
    nextAction.setDate(nextAction.getDate() + 30);
    return nextAction;
  }

  private determineNextActionType(assessment: PersistenceDependencyAssessment): string | undefined {
    if (assessment.isFinalized) {
      return undefined;
    }

    if (!assessment.lastCalculatedAt) {
      return 'CALCULATE_DISTRIBUTION';
    }

    if (new Date().getTime() - assessment.createdAt.getTime() > 30 * 24 * 60 * 60 * 1000) {
      return 'FINALIZE_ASSESSMENT';
    }

    return 'GATHER_EVIDENCE';
  }

  /**
   * Create filter conditions for Prisma query
   */
  toPrismaFilter(filters: any): any {
    const prismaFilter: any = {};

    if (filters.deceasedId) {
      prismaFilter.deceasedId = filters.deceasedId;
    }

    if (filters.isFinalized !== undefined) {
      prismaFilter.isFinalized = filters.isFinalized;
    }

    if (filters.dateOfDeathAfter) {
      prismaFilter.dateOfDeath = {
        ...prismaFilter.dateOfDeath,
        gte: filters.dateOfDeathAfter,
      };
    }

    if (filters.dateOfDeathBefore) {
      prismaFilter.dateOfDeath = {
        ...prismaFilter.dateOfDeath,
        lte: filters.dateOfDeathBefore,
      };
    }

    if (filters.courtStation) {
      prismaFilter.dependants = {
        some: {
          s26CourtOrder: {
            path: ['courtStation'],
            equals: filters.courtStation,
          },
        },
      };
    }

    return prismaFilter;
  }

  /**
   * Create sort conditions for Prisma query
   */
  toPrismaSort(sort?: { field: string; direction: 'asc' | 'desc' }): any {
    if (!sort) {
      return { createdAt: 'desc' };
    }

    const fieldMap: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      dateOfDeath: 'dateOfDeath',
      lastCalculatedAt: 'lastCalculatedAt',
    };

    const prismaField = fieldMap[sort.field] || 'createdAt';

    return {
      [prismaField]: sort.direction,
    };
  }

  /**
   * Map aggregate version to persistence version
   */
  toVersionedUpdate(aggregate: DependencyAssessmentAggregate): {
    where: { id: string; version: number };
    data: any;
  } {
    const props = aggregate.toJSON();
    const currentVersion = props.version;
    const nextVersion = currentVersion + 1;

    return {
      where: {
        id: props.id,
        version: currentVersion,
      },
      data: {
        version: nextVersion,
        updatedAt: new Date(),
      },
    };
  }

  /**
   * Extract dependant IDs from aggregate
   */
  extractDependantIds(aggregate: DependencyAssessmentAggregate): string[] {
    const props = aggregate.toJSON();
    return props.dependants.map((d) => d.dependantId);
  }

  /**
   * Extract gift IDs from aggregate
   */
  extractGiftIds(aggregate: DependencyAssessmentAggregate): string[] {
    const props = aggregate.toJSON();
    return props.giftsInterVivos.map((g) => g.giftId);
  }
}
