// src/estate-service/src/infrastructure/persistence/prisma/mappers/legal-dependant.mapper.ts
import { Injectable } from '@nestjs/common';
import { LegalDependant as PrismaLegalDependant } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import {
  DependantRelationship,
  DependantStatus,
  LegalDependant,
} from '../../../domain/entities/legal-dependant.entity';
import { DependencyLevel } from '../../../domain/enums/dependency-level.enum';
import { KenyanLawSection } from '../../../domain/enums/kenyan-law-section.enum';
import { MoneyVO } from '../../../domain/value-objects/money.vo';
import { DependantEvidenceMapper } from './dependant-evidence.mapper';

@Injectable()
export class LegalDependantMapper {
  constructor(private readonly evidenceMapper: DependantEvidenceMapper) {}

  /**
   * Convert Prisma model to Domain Entity
   */
  toDomain(
    prismaDependant: PrismaLegalDependant & {
      evidences?: any[];
    },
  ): LegalDependant {
    if (!prismaDependant) return null;

    const {
      id,
      estateId,
      deceasedId,
      dependantId,
      dependantName,
      relationship,
      lawSection,
      dependencyLevel,
      dateOfBirth,
      age,
      isMinor,
      isIncapacitated,
      hasDisability,
      disabilityPercentage,
      monthlyMaintenanceNeedsAmount,
      monthlyMaintenanceNeedsCurrency,
      annualSupportProvidedAmount,
      annualSupportProvidedCurrency,
      proposedAllocationAmount,
      proposedAllocationCurrency,
      status,
      rejectionReason,
      appealedReason,
      custodialParentId,
      guardianId,
      courtCaseNumber,
      courtOrderRef,
      notes,
      riskLevel,
      requiresCourtDetermination,
      createdAt,
      updatedAt,
      evidences = [],
    } = prismaDependant;

    // Create MoneyVO objects
    const monthlyMaintenanceNeeds = MoneyVO.create({
      amount: Number(monthlyMaintenanceNeedsAmount),
      currency: monthlyMaintenanceNeedsCurrency || 'KES',
    });

    const annualSupportProvided = annualSupportProvidedAmount
      ? MoneyVO.create({
          amount: Number(annualSupportProvidedAmount),
          currency: annualSupportProvidedCurrency || 'KES',
        })
      : undefined;

    const proposedAllocation = proposedAllocationAmount
      ? MoneyVO.create({
          amount: Number(proposedAllocationAmount),
          currency: proposedAllocationCurrency || 'KES',
        })
      : undefined;

    // Map enums
    const dependantRelationship = this.mapToDomainRelationship(relationship);
    const kenyanLawSection = this.mapToDomainLawSection(lawSection);
    const dependantDependencyLevel = this.mapToDomainDependencyLevel(dependencyLevel);
    const dependantStatus = this.mapToDomainDependantStatus(status);

    // Map evidence
    const evidence = this.evidenceMapper.toDomainList(evidences);

    // Create LegalDependantProps
    const dependantProps = {
      estateId,
      deceasedId,
      dependantId,
      dependantName,
      relationship: dependantRelationship,
      lawSection: kenyanLawSection,
      dependencyLevel: dependantDependencyLevel,
      dateOfBirth: dateOfBirth || undefined,
      age: age || undefined,
      isMinor,
      isIncapacitated,
      hasDisability,
      disabilityPercentage: disabilityPercentage || undefined,
      monthlyMaintenanceNeeds,
      annualSupportProvided,
      proposedAllocation,
      evidence,
      isVerified: status === 'VERIFIED' || status === 'SETTLED',
      verifiedBy: undefined, // Would need separate field
      verifiedAt: undefined, // Would need separate field
      status: dependantStatus,
      rejectionReason: rejectionReason || undefined,
      appealedReason: appealedReason || undefined,
      custodialParentId: custodialParentId || undefined,
      guardianId: guardianId || undefined,
      courtCaseNumber: courtCaseNumber || undefined,
      courtOrderRef: courtOrderRef || undefined,
      notes: notes || undefined,
      riskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
      requiresCourtDetermination,
      createdAt,
      updatedAt,
    };

    return LegalDependant.create(dependantProps, new UniqueEntityID(id));
  }

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(dependant: LegalDependant): Partial<PrismaLegalDependant> {
    const props = dependant.getProps();

    return {
      id: dependant.id.toString(),
      estateId: props.estateId,
      deceasedId: props.deceasedId,
      dependantId: props.dependantId,
      dependantName: props.dependantName,
      relationship: this.mapToPrismaRelationship(props.relationship),
      lawSection: this.mapToPrismaLawSection(props.lawSection),
      dependencyLevel: this.mapToPrismaDependencyLevel(props.dependencyLevel),
      dateOfBirth: props.dateOfBirth || null,
      age: props.age || null,
      isMinor: props.isMinor,
      isIncapacitated: props.isIncapacitated,
      hasDisability: props.hasDisability,
      disabilityPercentage: props.disabilityPercentage || null,
      monthlyMaintenanceNeedsAmount: props.monthlyMaintenanceNeeds.amount,
      monthlyMaintenanceNeedsCurrency: props.monthlyMaintenanceNeeds.currency,
      annualSupportProvidedAmount: props.annualSupportProvided?.amount || null,
      annualSupportProvidedCurrency: props.annualSupportProvided?.currency || null,
      proposedAllocationAmount: props.proposedAllocation?.amount || null,
      proposedAllocationCurrency: props.proposedAllocation?.currency || null,
      status: this.mapToPrismaDependantStatus(props.status),
      rejectionReason: props.rejectionReason || null,
      appealedReason: props.appealedReason || null,
      custodialParentId: props.custodialParentId || null,
      guardianId: props.guardianId || null,
      courtCaseNumber: props.courtCaseNumber || null,
      courtOrderRef: props.courtOrderRef || null,
      notes: props.notes || null,
      riskLevel: props.riskLevel,
      requiresCourtDetermination: props.requiresCourtDetermination,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Convert array of Prisma models to Domain Entities
   */
  toDomainList(
    prismaDependants: (PrismaLegalDependant & { evidences?: any[] })[],
  ): LegalDependant[] {
    return prismaDependants
      .map((dependant) => this.toDomain(dependant))
      .filter((dependant) => dependant !== null);
  }

  /**
   * Convert array of Domain Entities to Prisma models
   */
  toPersistenceList(dependants: LegalDependant[]): Partial<PrismaLegalDependant>[] {
    return dependants.map((dependant) => this.toPersistence(dependant));
  }

  /**
   * Map Prisma relationship to Domain enum
   */
  private mapToDomainRelationship(prismaRelationship: string): DependantRelationship {
    switch (prismaRelationship) {
      case 'SPOUSE':
        return DependantRelationship.SPOUSE;
      case 'CHILD':
        return DependantRelationship.CHILD;
      case 'ADOPTED_CHILD':
        return DependantRelationship.ADOPTED_CHILD;
      case 'STEP_CHILD':
        return DependantRelationship.STEP_CHILD;
      case 'PARENT':
        return DependantRelationship.PARENT;
      case 'SIBLING':
        return DependantRelationship.SIBLING;
      case 'GRANDCHILD':
        return DependantRelationship.GRANDCHILD;
      case 'NIECE_NEPHEW':
        return DependantRelationship.NIECE_NEPHEW;
      case 'OTHER':
        return DependantRelationship.OTHER;
      default:
        throw new Error(`Unknown dependant relationship: ${prismaRelationship}`);
    }
  }

  /**
   * Map Domain relationship to Prisma enum
   */
  private mapToPrismaRelationship(domainRelationship: DependantRelationship): string {
    switch (domainRelationship) {
      case DependantRelationship.SPOUSE:
        return 'SPOUSE';
      case DependantRelationship.CHILD:
        return 'CHILD';
      case DependantRelationship.ADOPTED_CHILD:
        return 'ADOPTED_CHILD';
      case DependantRelationship.STEP_CHILD:
        return 'STEP_CHILD';
      case DependantRelationship.PARENT:
        return 'PARENT';
      case DependantRelationship.SIBLING:
        return 'SIBLING';
      case DependantRelationship.GRANDCHILD:
        return 'GRANDCHILD';
      case DependantRelationship.NIECE_NEPHEW:
        return 'NIECE_NEPHEW';
      case DependantRelationship.OTHER:
        return 'OTHER';
      default:
        throw new Error(`Unknown dependant relationship: ${domainRelationship}`);
    }
  }

  /**
   * Map Prisma law section to Domain enum
   */
  private mapToDomainLawSection(prismaSection: string): KenyanLawSection {
    switch (prismaSection) {
      case 'S26_DEPENDANT_PROVISION':
        return KenyanLawSection.S26_DEPENDANT_PROVISION;
      case 'S29_DEPENDANTS':
        return KenyanLawSection.S29_DEPENDANTS;
      case 'S35_SPOUSAL_CHILDS_SHARE':
        return KenyanLawSection.S35_SPOUSAL_CHILDS_SHARE;
      case 'S40_POLYGAMY':
        return KenyanLawSection.S40_POLYGAMY;
      case 'S45_DEBT_PRIORITY':
        return KenyanLawSection.S45_DEBT_PRIORITY;
      case 'S70_TESTAMENTARY_GUARDIAN':
        return KenyanLawSection.S70_TESTAMENTARY_GUARDIAN;
      case 'S71_COURT_GUARDIAN':
        return KenyanLawSection.S71_COURT_GUARDIAN;
      case 'S72_GUARDIAN_BOND':
        return KenyanLawSection.S72_GUARDIAN_BOND;
      case 'S73_GUARDIAN_ACCOUNTS':
        return KenyanLawSection.S73_GUARDIAN_ACCOUNTS;
      case 'S83_EXECUTOR_DUTIES':
        return KenyanLawSection.S83_EXECUTOR_DUTIES;
      default:
        throw new Error(`Unknown law section: ${prismaSection}`);
    }
  }

  /**
   * Map Domain law section to Prisma enum
   */
  private mapToPrismaLawSection(domainSection: KenyanLawSection): string {
    switch (domainSection) {
      case KenyanLawSection.S26_DEPENDANT_PROVISION:
        return 'S26_DEPENDANT_PROVISION';
      case KenyanLawSection.S29_DEPENDANTS:
        return 'S29_DEPENDANTS';
      case KenyanLawSection.S35_SPOUSAL_CHILDS_SHARE:
        return 'S35_SPOUSAL_CHILDS_SHARE';
      case KenyanLawSection.S40_POLYGAMY:
        return 'S40_POLYGAMY';
      case KenyanLawSection.S45_DEBT_PRIORITY:
        return 'S45_DEBT_PRIORITY';
      case KenyanLawSection.S70_TESTAMENTARY_GUARDIAN:
        return 'S70_TESTAMENTARY_GUARDIAN';
      case KenyanLawSection.S71_COURT_GUARDIAN:
        return 'S71_COURT_GUARDIAN';
      case KenyanLawSection.S72_GUARDIAN_BOND:
        return 'S72_GUARDIAN_BOND';
      case KenyanLawSection.S73_GUARDIAN_ACCOUNTS:
        return 'S73_GUARDIAN_ACCOUNTS';
      case KenyanLawSection.S83_EXECUTOR_DUTIES:
        return 'S83_EXECUTOR_DUTIES';
      default:
        throw new Error(`Unknown law section: ${domainSection}`);
    }
  }

  /**
   * Map Prisma dependency level to Domain enum
   */
  private mapToDomainDependencyLevel(prismaLevel: string): DependencyLevel {
    switch (prismaLevel) {
      case 'NONE':
        return DependencyLevel.NONE;
      case 'PARTIAL':
        return DependencyLevel.PARTIAL;
      case 'FULL':
        return DependencyLevel.FULL;
      default:
        throw new Error(`Unknown dependency level: ${prismaLevel}`);
    }
  }

  /**
   * Map Domain dependency level to Prisma enum
   */
  private mapToPrismaDependencyLevel(domainLevel: DependencyLevel): string {
    switch (domainLevel) {
      case DependencyLevel.NONE:
        return 'NONE';
      case DependencyLevel.PARTIAL:
        return 'PARTIAL';
      case DependencyLevel.FULL:
        return 'FULL';
      default:
        throw new Error(`Unknown dependency level: ${domainLevel}`);
    }
  }

  /**
   * Map Prisma dependant status to Domain enum
   */
  private mapToDomainDependantStatus(prismaStatus: string): DependantStatus {
    switch (prismaStatus) {
      case 'DRAFT':
        return DependantStatus.DRAFT;
      case 'PENDING_VERIFICATION':
        return DependantStatus.PENDING_VERIFICATION;
      case 'VERIFIED':
        return DependantStatus.VERIFIED;
      case 'REJECTED':
        return DependantStatus.REJECTED;
      case 'APPEALED':
        return DependantStatus.APPEALED;
      case 'SETTLED':
        return DependantStatus.SETTLED;
      case 'DISPUTED':
        return DependantStatus.DISPUTED;
      default:
        throw new Error(`Unknown dependant status: ${prismaStatus}`);
    }
  }

  /**
   * Map Domain dependant status to Prisma enum
   */
  private mapToPrismaDependantStatus(domainStatus: DependantStatus): string {
    switch (domainStatus) {
      case DependantStatus.DRAFT:
        return 'DRAFT';
      case DependantStatus.PENDING_VERIFICATION:
        return 'PENDING_VERIFICATION';
      case DependantStatus.VERIFIED:
        return 'VERIFIED';
      case DependantStatus.REJECTED:
        return 'REJECTED';
      case DependantStatus.APPEALED:
        return 'APPEALED';
      case DependantStatus.SETTLED:
        return 'SETTLED';
      case DependantStatus.DISPUTED:
        return 'DISPUTED';
      default:
        throw new Error(`Unknown dependant status: ${domainStatus}`);
    }
  }

  /**
   * Get dependant statistics
   */
  getDependantStatistics(dependants: LegalDependant[]): {
    totalCount: number;
    verifiedCount: number;
    blockedCount: number;
    totalMonthlyNeeds: MoneyVO;
    byRelationship: Record<string, number>;
    byStatus: Record<string, number>;
    byRiskLevel: Record<string, number>;
    section29aCount: number;
    section29bCount: number;
    courtInterventionRequired: number;
  } {
    const blockedCount = dependants.filter((d) => d.blocksEstateDistribution()).length;
    const courtInterventionRequired = dependants.filter((d) =>
      d.requiresCourtIntervention(),
    ).length;

    // Calculate total monthly needs
    const totalMonthlyNeeds = dependants.reduce(
      (sum, dependant) => sum.add(dependant.monthlyMaintenanceNeeds),
      MoneyVO.zero('KES'),
    );

    // Count by relationship
    const byRelationship = dependants.reduce(
      (acc, dependant) => {
        const relationship = dependant.relationship;
        acc[relationship] = (acc[relationship] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Count by status
    const byStatus = dependants.reduce(
      (acc, dependant) => {
        const status = dependant.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Count by risk level
    const byRiskLevel = dependants.reduce(
      (acc, dependant) => {
        const riskLevel = dependant.riskLevel;
        acc[riskLevel] = (acc[riskLevel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Count by S.29 classification
    const section29aCount = dependants.filter((d) => d.isSection29A()).length;
    const section29bCount = dependants.filter((d) => d.isSection29B()).length;

    return {
      totalCount: dependants.length,
      verifiedCount: dependants.filter((d) => d.isVerified).length,
      blockedCount,
      totalMonthlyNeeds,
      byRelationship,
      byStatus,
      byRiskLevel,
      section29aCount,
      section29bCount,
      courtInterventionRequired,
    };
  }

  /**
   * Filter dependants by relationship
   */
  filterByRelationship(
    dependants: LegalDependant[],
    relationship: DependantRelationship,
  ): LegalDependant[] {
    return dependants.filter((dependant) => dependant.relationship === relationship);
  }

  /**
   * Filter dependants by status
   */
  filterByStatus(dependants: LegalDependant[], status: DependantStatus): LegalDependant[] {
    return dependants.filter((dependant) => dependant.status === status);
  }

  /**
   * Filter dependants requiring court intervention
   */
  filterRequiringCourtIntervention(dependants: LegalDependant[]): LegalDependant[] {
    return dependants.filter((dependant) => dependant.requiresCourtIntervention());
  }

  /**
   * Filter dependants blocking estate distribution
   */
  filterBlockingEstateDistribution(dependants: LegalDependant[]): LegalDependant[] {
    return dependants.filter((dependant) => dependant.blocksEstateDistribution());
  }

  /**
   * Calculate total provision required for dependants
   */
  calculateTotalProvisionRequired(
    dependants: LegalDependant[],
    estateNetValue: MoneyVO,
  ): {
    totalProvision: MoneyVO;
    provisionByDependant: Map<string, MoneyVO>;
    canEstateAfford: boolean;
  } {
    const provisionByDependant = new Map<string, MoneyVO>();
    let totalProvision = MoneyVO.zero('KES');

    dependants.forEach((dependant) => {
      if (dependant.status === DependantStatus.VERIFIED) {
        const provision = dependant.calculateReasonableProvision(estateNetValue, dependants.length);
        provisionByDependant.set(dependant.id.toString(), provision);
        totalProvision = totalProvision.add(provision);
      }
    });

    const canEstateAfford = totalProvision.isLessThan(estateNetValue);

    return {
      totalProvision,
      provisionByDependant,
      canEstateAfford,
    };
  }

  /**
   * Prepare dependant claims for court submission
   */
  prepareCourtSubmission(dependants: LegalDependant[]): Array<{
    dependantId: string;
    dependantName: string;
    relationship: string;
    status: string;
    monthlyNeeds: number;
    evidenceCount: number;
    riskLevel: string;
    requiresCourtDetermination: boolean;
  }> {
    return dependants.map((dependant) => {
      const props = dependant.getProps();

      return {
        dependantId: dependant.dependantId,
        dependantName: props.dependantName,
        relationship: props.relationship,
        status: props.status,
        monthlyNeeds: props.monthlyMaintenanceNeeds.amount,
        evidenceCount: props.evidence.length,
        riskLevel: props.riskLevel,
        requiresCourtDetermination: props.requiresCourtDetermination,
      };
    });
  }

  /**
   * Update dependant status
   */
  updateDependantStatus(
    dependant: LegalDependant,
    newStatus: DependantStatus,
    updatedBy: string,
    reason?: string,
  ): Partial<PrismaLegalDependant> {
    const updates: Partial<PrismaLegalDependant> = {
      status: this.mapToPrismaDependantStatus(newStatus),
      updatedAt: new Date(),
    };

    if (newStatus === DependantStatus.REJECTED && reason) {
      updates.rejectionReason = reason;
    }

    if (newStatus === DependantStatus.VERIFIED) {
      // Would need to update verifiedBy and verifiedAt fields
    }

    return updates;
  }

  /**
   * Create initial dependant data
   */
  createInitialDependantData(
    estateId: string,
    deceasedId: string,
    dependantData: {
      dependantId: string;
      dependantName: string;
      relationship: DependantRelationship;
      dateOfBirth?: Date;
      monthlyNeeds: MoneyVO;
      lawSection?: KenyanLawSection;
      custodialParentId?: string;
    },
    createdBy: string,
  ): Partial<PrismaLegalDependant> {
    const now = new Date();

    return {
      id: new UniqueEntityID().toString(),
      estateId,
      deceasedId,
      dependantId: dependantData.dependantId,
      dependantName: dependantData.dependantName,
      relationship: this.mapToPrismaRelationship(dependantData.relationship),
      lawSection: dependantData.lawSection
        ? this.mapToPrismaLawSection(dependantData.lawSection)
        : this.mapToPrismaLawSection(KenyanLawSection.S29_DEPENDANTS),
      dependencyLevel: 'FULL',
      dateOfBirth: dependantData.dateOfBirth || null,
      isMinor: dependantData.dateOfBirth
        ? (new Date().getTime() - dependantData.dateOfBirth.getTime()) /
            (1000 * 3600 * 24 * 365.25) <
          18
        : false,
      isIncapacitated: false,
      hasDisability: false,
      monthlyMaintenanceNeedsAmount: dependantData.monthlyNeeds.amount,
      monthlyMaintenanceNeedsCurrency: dependantData.monthlyNeeds.currency,
      status: 'PENDING_VERIFICATION',
      custodialParentId: dependantData.custodialParentId || null,
      riskLevel: 'MEDIUM',
      requiresCourtDetermination: false,
      createdAt: now,
      updatedAt: now,
    };
  }
}
