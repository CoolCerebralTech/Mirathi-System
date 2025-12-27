// src/estate-service/src/infrastructure/persistence/mappers/legal-dependant.mapper.ts
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
    if (!prismaDependant) throw new Error('Cannot map null Prisma object');

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
      // annualSupportProvidedCurrency, // Does not exist in schema
      proposedAllocationAmount,
      // proposedAllocationCurrency, // Does not exist in schema
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

    // Use the main currency for all monetary values related to this dependant
    const currency = monthlyMaintenanceNeedsCurrency || 'KES';

    const monthlyMaintenanceNeeds = MoneyVO.create({
      amount: Number(monthlyMaintenanceNeedsAmount),
      currency: currency,
    });

    const annualSupportProvided = annualSupportProvidedAmount
      ? MoneyVO.create({
          amount: Number(annualSupportProvidedAmount),
          currency: currency,
        })
      : undefined;

    const proposedAllocation = proposedAllocationAmount
      ? MoneyVO.create({
          amount: Number(proposedAllocationAmount),
          currency: currency,
        })
      : undefined;

    const dependantProps = {
      estateId,
      deceasedId,
      dependantId,
      dependantName,
      relationship: this.mapToDomainRelationship(relationship),
      lawSection: this.mapToDomainLawSection(lawSection),
      dependencyLevel: this.mapToDomainDependencyLevel(dependencyLevel),
      dateOfBirth: dateOfBirth || undefined,
      age: age || undefined,
      isMinor,
      isIncapacitated,
      hasDisability,
      disabilityPercentage: disabilityPercentage ? Number(disabilityPercentage) : undefined,
      monthlyMaintenanceNeeds,
      annualSupportProvided,
      proposedAllocation,
      evidence: this.evidenceMapper.toDomainList(evidences),
      isVerified: status === 'VERIFIED' || status === 'SETTLED',
      verifiedBy: undefined,
      verifiedAt: undefined,
      status: this.mapToDomainDependantStatus(status),
      rejectionReason: rejectionReason || undefined,
      appealedReason: appealedReason || undefined,
      custodialParentId: custodialParentId || undefined,
      guardianId: guardianId || undefined,
      courtCaseNumber: courtCaseNumber || undefined,
      courtOrderRef: courtOrderRef || undefined,
      notes: notes || undefined,
      riskLevel: (riskLevel as 'LOW' | 'MEDIUM' | 'HIGH') || 'LOW',
      requiresCourtDetermination,
      createdAt,
      updatedAt,
    };

    return LegalDependant.create(dependantProps, new UniqueEntityID(id));
  }

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(dependant: LegalDependant): any {
    // USE PUBLIC GETTERS

    return {
      id: dependant.id.toString(),
      estateId: dependant.estateId,
      deceasedId: dependant.deceasedId,
      dependantId: dependant.dependantId,
      dependantName: dependant.dependantName,
      relationship: this.mapToPrismaRelationship(dependant.relationship) as any,
      lawSection: this.mapToPrismaLawSection(dependant.lawSection) as any,
      dependencyLevel: this.mapToPrismaDependencyLevel(dependant.dependencyLevel) as any,
      dateOfBirth: dependant.dateOfBirth || null,
      age: dependant.age || null,
      isMinor: dependant.isMinor,
      isIncapacitated: dependant.isIncapacitated,
      hasDisability: dependant.hasDisability,
      disabilityPercentage: dependant.disabilityPercentage || null,

      monthlyMaintenanceNeedsAmount: dependant.monthlyMaintenanceNeeds.amount,
      monthlyMaintenanceNeedsCurrency: dependant.monthlyMaintenanceNeeds.currency,

      annualSupportProvidedAmount: dependant.annualSupportProvided?.amount || null,
      // No currency column for annualSupport

      proposedAllocationAmount: dependant.proposedAllocation?.amount || null,
      // No currency column for proposedAllocation

      status: this.mapToPrismaDependantStatus(dependant.status) as any,
      rejectionReason: dependant.rejectionReason || null,
      appealedReason: dependant.appealedReason || null,
      custodialParentId: dependant.custodialParentId || null,
      guardianId: dependant.guardianId || null,
      courtCaseNumber: dependant.courtCaseNumber || null,
      courtOrderRef: dependant.courtOrderRef || null,
      notes: dependant.notes || null,
      riskLevel: dependant.riskLevel,
      requiresCourtDetermination: dependant.requiresCourtDetermination,
      createdAt: dependant.createdAt,
      updatedAt: dependant.updatedAt,
    };
  }

  // ... (Rest of the mapper methods remain correct) ...

  toDomainList(
    prismaDependants: (PrismaLegalDependant & { evidences?: any[] })[],
  ): LegalDependant[] {
    return prismaDependants
      .map((d) => {
        try {
          return this.toDomain(d);
        } catch {
          return null;
        }
      })
      .filter((d): d is LegalDependant => d !== null);
  }

  toPersistenceList(dependants: LegalDependant[]): any[] {
    return dependants.map((d) => this.toPersistence(d));
  }

  private mapToDomainRelationship(prismaType: string): DependantRelationship {
    return prismaType as DependantRelationship;
  }

  private mapToPrismaRelationship(domainType: DependantRelationship): string {
    return domainType.toString();
  }

  private mapToDomainLawSection(prismaType: string): KenyanLawSection {
    return prismaType as KenyanLawSection;
  }

  private mapToPrismaLawSection(domainType: KenyanLawSection): string {
    return domainType.toString();
  }

  private mapToDomainDependencyLevel(prismaType: string): DependencyLevel {
    return prismaType as DependencyLevel;
  }

  private mapToPrismaDependencyLevel(domainType: DependencyLevel): string {
    return domainType.toString();
  }

  private mapToDomainDependantStatus(prismaType: string): DependantStatus {
    return prismaType as DependantStatus;
  }

  private mapToPrismaDependantStatus(domainType: DependantStatus): string {
    return domainType.toString();
  }
}
