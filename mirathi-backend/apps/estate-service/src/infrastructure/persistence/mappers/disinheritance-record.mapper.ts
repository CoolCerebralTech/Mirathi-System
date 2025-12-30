// src/estate-service/src/infrastructure/persistence/mappers/disinheritance-record.mapper.ts
import { Injectable } from '@nestjs/common';
import { DisinheritanceRecord as PrismaDisinheritanceRecord } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import {
  DisinheritanceEvidenceType,
  DisinheritanceReasonCategory,
  DisinheritanceRecord,
} from '../../../domain/entities/disinheritance-record.entity';
import { BeneficiaryIdentity } from '../../../domain/value-objects/beneficiary-identity.vo';

@Injectable()
export class DisinheritanceRecordMapper {
  toDomain(prismaRecord: PrismaDisinheritanceRecord): DisinheritanceRecord {
    const {
      id,
      willId,
      reasonCategory,
      reasonDescription,
      legalBasis,
      evidence,
      appliesToBequests,
      isCompleteDisinheritance,
      reinstatementConditions,
      isAcknowledgedByDisinherited,
      acknowledgmentDate,
      acknowledgmentMethod,
      legalRiskLevel,
      riskMitigationSteps,
      isActive,
      deactivatedReason,
      deactivatedAt,
    } = prismaRecord;

    // 1. Parse disinherited person from JSON
    const disinheritedPersonJson = prismaRecord.disinheritedPerson as any;
    const disinheritedPerson = BeneficiaryIdentity.create({
      type: disinheritedPersonJson.type,
      userId: disinheritedPersonJson.userId,
      familyMemberId: disinheritedPersonJson.familyMemberId,
      externalDetails: disinheritedPersonJson.externalDetails,
    });

    // 2. Parse Evidence (Safely handle JSON and type casting)
    let parsedEvidence: {
      type: DisinheritanceEvidenceType;
      documentId?: string;
      description: string;
    }[] = [];

    const rawEvidence = Array.isArray(evidence) ? evidence : [];
    // If evidence is stored as a JSON string in DB, parse it first (uncommon in Prisma if type is Json)
    // Assuming Prisma Json type returns an object/array directly:

    parsedEvidence = (rawEvidence as any[]).map((e) => ({
      type: e.type as DisinheritanceEvidenceType, // Explicit cast
      description: e.description,
      documentId: e.documentId,
    }));

    // 3. Helper to parse string[] or Json
    const parseStringArray = (val: any): string[] => {
      if (Array.isArray(val)) return val;
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    };

    const parsedAppliesToBequests = parseStringArray(appliesToBequests);
    const parsedReinstatementConditions = parseStringArray(reinstatementConditions);
    const parsedRiskMitigationSteps = parseStringArray(riskMitigationSteps);

    return DisinheritanceRecord.create(
      {
        willId,
        disinheritedPerson,
        reasonCategory: reasonCategory as DisinheritanceReasonCategory,
        reasonDescription,
        legalBasis: legalBasis || undefined,
        evidence: parsedEvidence,
        appliesToBequests: parsedAppliesToBequests,
        isCompleteDisinheritance,
        reinstatementConditions: parsedReinstatementConditions,
        isAcknowledgedByDisinherited,
        acknowledgmentDate: acknowledgmentDate ? new Date(acknowledgmentDate) : undefined,
        acknowledgmentMethod: acknowledgmentMethod as any,
        legalRiskLevel: legalRiskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        riskMitigationSteps: parsedRiskMitigationSteps,
        isActive,
        deactivatedReason: deactivatedReason || undefined,
        deactivatedAt: deactivatedAt ? new Date(deactivatedAt) : undefined,
      },
      new UniqueEntityID(id),
    );
  }

  toPersistence(record: DisinheritanceRecord): any {
    // 1. Convert Value Objects to JSON
    const disinheritedPerson = record.disinheritedPerson.toJSON();

    // 2. Convert Evidence Array
    // Prisma usually expects direct objects for Json columns, not stringified JSON
    const evidence = record.evidence;

    // 3. Handle Arrays for potential JSON columns
    // Explicit type union to allow null assignment for optional fields
    let appliesToBequests: string[] | null = null;
    if (record.appliesToBequests && record.appliesToBequests.length > 0) {
      appliesToBequests = record.appliesToBequests;
    }

    let reinstatementConditions: string[] | null = null;
    if (record.reinstatementConditions && record.reinstatementConditions.length > 0) {
      reinstatementConditions = record.reinstatementConditions;
    }

    // Risk mitigation steps is required in Domain, so we pass array directly
    const riskMitigationSteps = record.riskMitigationSteps;

    return {
      id: record.id.toString(),
      willId: record.willId,
      disinheritedPerson, // JSON
      reasonCategory: record.reasonCategory,
      reasonDescription: record.reasonDescription,
      legalBasis: record.legalBasis || null,
      evidence, // JSON
      appliesToBequests, // JSON or String[] depending on DB
      isCompleteDisinheritance: record.isCompleteDisinheritance,
      reinstatementConditions, // JSON
      isAcknowledgedByDisinherited: record.isAcknowledgedByDisinherited,
      acknowledgmentDate: record.acknowledgmentDate || null,
      acknowledgmentMethod: record.acknowledgmentMethod || null,
      legalRiskLevel: record.legalRiskLevel,
      riskMitigationSteps, // JSON
      isActive: record.isActive,
      deactivatedReason: record.deactivatedReason || null,
      deactivatedAt: record.deactivatedAt || null,
      updatedAt: new Date(),
    };
  }

  toDomainList(prismaRecords: PrismaDisinheritanceRecord[]): DisinheritanceRecord[] {
    if (!prismaRecords) return [];
    return prismaRecords
      .map((record) => {
        try {
          return this.toDomain(record);
        } catch (error) {
          console.error(`Error mapping disinheritance record ${record.id}:`, error);
          return null;
        }
      })
      .filter((record): record is DisinheritanceRecord => record !== null);
  }

  /**
   * Partial persistence for updates
   */
  toPartialPersistence(record: DisinheritanceRecord): Partial<any> {
    // Simplified partial update object
    const result: any = {
      updatedAt: new Date(),
    };

    // Only map fields that might change via update methods
    if (record.reasonCategory) result.reasonCategory = record.reasonCategory;
    if (record.reasonDescription) result.reasonDescription = record.reasonDescription;

    // Complex fields need full replacement usually
    if (record.evidence) result.evidence = record.evidence;

    return result;
  }
}
