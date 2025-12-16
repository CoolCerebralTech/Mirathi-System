// family-relationship.mapper.ts
import { Injectable } from '@nestjs/common';
import {
  Prisma,
  FamilyRelationship as PrismaFamilyRelationship,
  RelationshipType,
} from '@prisma/client';

import {
  FamilyRelationship,
  FamilyRelationshipProps,
  RelationshipStrength,
} from '../../../domain/entities/family-relationship.entity';
import {
  InheritanceRights,
  InheritanceRightsType,
} from '../../../domain/value-objects/legal/inheritance-rights.vo';
import { RelationshipTypeVO } from '../../../domain/value-objects/legal/relationship-type.vo';

@Injectable()
export class FamilyRelationshipMapper {
  /**
   * Converts Prisma FamilyRelationship to Domain FamilyRelationship entity
   * Handles complex InheritanceRights Value Object reconstruction
   */
  toDomain(raw: PrismaFamilyRelationship | null): FamilyRelationship | null {
    if (!raw) return null;

    try {
      // 1. Reconstitute RelationshipTypeVO
      const relationshipTypeVO = RelationshipTypeVO.create(raw.type);

      // 2. Reconstitute InheritanceRights with fallback logic
      const inheritanceRights = this.reconstituteInheritanceRights(raw, relationshipTypeVO);

      // 3. Parse JSON fields safely
      const verificationDocuments = this.parseJsonSafely(raw.verificationDocuments);
      const customaryCeremonyDetails = this.parseJsonSafely(raw.customaryCeremonyDetails);

      // 4. Assemble props
      const props: FamilyRelationshipProps = {
        id: raw.id,
        familyId: raw.familyId,
        fromMemberId: raw.fromMemberId,
        toMemberId: raw.toMemberId,
        type: raw.type,
        isBiological: raw.isBiological,
        isAdopted: raw.isAdopted,
        adoptionOrderNumber: raw.adoptionOrderNumber ?? undefined,
        adoptionCourt: raw.adoptionCourt ?? undefined,
        adoptionDate: raw.adoptionDate ? new Date(raw.adoptionDate) : undefined,
        isCustomaryAdoption: raw.isCustomaryAdoption,
        strength: raw.strength,
        relationshipStartDate: raw.relationshipStartDate
          ? new Date(raw.relationshipStartDate)
          : undefined,
        relationshipEndDate: raw.relationshipEndDate
          ? new Date(raw.relationshipEndDate)
          : undefined,
        endReason: raw.endReason ?? undefined,
        isVerified: raw.isVerified,
        verificationMethod: raw.verificationMethod ?? undefined,
        verificationDocuments,
        verifiedAt: raw.verifiedAt ? new Date(raw.verifiedAt) : undefined,
        verifiedBy: raw.verifiedBy ?? undefined,
        isNextOfKin: raw.isNextOfKin,
        nextOfKinPriority: raw.nextOfKinPriority,
        recognizedUnderCustomaryLaw: raw.recognizedUnderCustomaryLaw,
        customaryCeremonyDetails,
        isContested: raw.isContested,
        contestationCaseNumber: raw.contestationCaseNumber ?? undefined,
        courtValidated: raw.courtValidated,
        inheritanceRights,
        version: raw.version,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
      };

      return FamilyRelationship.createFromProps(props);
    } catch (error) {
      console.error('Error reconstituting FamilyRelationship from persistence:', error);
      throw new Error(`Failed to reconstitute FamilyRelationship ${raw.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain FamilyRelationship entity to Prisma create/update input
   */
  toPersistence(entity: FamilyRelationship): Prisma.FamilyRelationshipUncheckedCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      familyId: props.familyId,
      fromMemberId: props.fromMemberId,
      toMemberId: props.toMemberId,
      type: props.type,
      isBiological: props.isBiological,
      isAdopted: props.isAdopted,
      adoptionOrderNumber: props.adoptionOrderNumber,
      adoptionCourt: props.adoptionCourt,
      adoptionDate: props.adoptionDate,
      isCustomaryAdoption: props.isCustomaryAdoption,
      isVerified: props.isVerified,
      verificationMethod: props.verificationMethod,
      verificationDocuments: props.verificationDocuments,
      verifiedAt: props.verifiedAt,
      verifiedBy: props.verifiedBy,
      inheritanceRights: props.inheritanceRights.type,
      strength: props.strength,
      relationshipStartDate: props.relationshipStartDate,
      relationshipEndDate: props.relationshipEndDate,
      endReason: props.endReason,
      isNextOfKin: props.isNextOfKin,
      nextOfKinPriority: props.nextOfKinPriority,
      recognizedUnderCustomaryLaw: props.recognizedUnderCustomaryLaw,
      customaryCeremonyDetails: props.customaryCeremonyDetails,
      isContested: props.isContested,
      contestationCaseNumber: props.contestationCaseNumber,
      courtValidated: props.courtValidated,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates a partial update DTO from domain changes
   */
  toPrismaUpdate(entity: FamilyRelationship): Prisma.FamilyRelationshipUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      isVerified: props.isVerified,
      verificationMethod: props.verificationMethod,
      verificationDocuments: props.verificationDocuments,
      verifiedAt: props.verifiedAt,
      verifiedBy: props.verifiedBy,
      inheritanceRights: props.inheritanceRights.type,
      strength: props.strength,
      relationshipStartDate: props.relationshipStartDate,
      relationshipEndDate: props.relationshipEndDate,
      endReason: props.endReason,
      isNextOfKin: props.isNextOfKin,
      nextOfKinPriority: props.nextOfKinPriority,
      recognizedUnderCustomaryLaw: props.recognizedUnderCustomaryLaw,
      customaryCeremonyDetails: props.customaryCeremonyDetails,
      isContested: props.isContested,
      contestationCaseNumber: props.contestationCaseNumber,
      courtValidated: props.courtValidated,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts domain entity to Prisma create input with relationships
   */
  toPrismaCreate(entity: FamilyRelationship): Prisma.FamilyRelationshipCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      family: { connect: { id: props.familyId } },
      fromMember: { connect: { id: props.fromMemberId } },
      toMember: { connect: { id: props.toMemberId } },
      type: props.type,
      isBiological: props.isBiological,
      isAdopted: props.isAdopted,
      adoptionOrderNumber: props.adoptionOrderNumber,
      adoptionCourt: props.adoptionCourt,
      adoptionDate: props.adoptionDate,
      isCustomaryAdoption: props.isCustomaryAdoption,
      isVerified: props.isVerified,
      verificationMethod: props.verificationMethod,
      verificationDocuments: props.verificationDocuments,
      verifiedAt: props.verifiedAt,
      verifiedBy: props.verifiedBy,
      inheritanceRights: props.inheritanceRights.type,
      strength: props.strength,
      relationshipStartDate: props.relationshipStartDate,
      relationshipEndDate: props.relationshipEndDate,
      endReason: props.endReason,
      isNextOfKin: props.isNextOfKin,
      nextOfKinPriority: props.nextOfKinPriority,
      recognizedUnderCustomaryLaw: props.recognizedUnderCustomaryLaw,
      customaryCeremonyDetails: props.customaryCeremonyDetails,
      isContested: props.isContested,
      contestationCaseNumber: props.contestationCaseNumber,
      courtValidated: props.courtValidated,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Reconstitutes InheritanceRights Value Object from persistence data
   */
  private reconstituteInheritanceRights(
    raw: PrismaFamilyRelationship,
    relationshipTypeVO: RelationshipTypeVO,
  ): InheritanceRights {
    const rightsType = raw.inheritanceRights as InheritanceRightsType;

    // Determine share percentage based on relationship type and strength
    const sharePercentage = this.calculateSharePercentage(raw, relationshipTypeVO);

    // Create the InheritanceRights VO
    return InheritanceRights.create(rightsType, relationshipTypeVO, sharePercentage);
  }

  /**
   * Calculates share percentage based on relationship type, strength, and Kenyan law
   */
  private calculateSharePercentage(
    raw: PrismaFamilyRelationship,
    relationshipTypeVO: RelationshipTypeVO,
  ): number {
    const { type, strength, isAdopted, isCustomaryAdoption } = raw;

    // Base logic from FamilyRelationship.create() method
    if (type === 'STEPCHILD' || type === 'EX_SPOUSE') {
      return 50; // Default for partial rights
    }

    if (
      type === 'GUARDIAN' ||
      type === 'OTHER' ||
      type === 'COUSIN' ||
      type === 'AUNT_UNCLE' ||
      type === 'NIECE_NEPHEW'
    ) {
      return 0;
    }

    // Override for adopted children (full rights under Children Act)
    if (isAdopted) {
      return 100;
    }

    // Customary adoption may have different rules
    if (isCustomaryAdoption && strength === 'ADOPTED') {
      return 100; // Customary adoptions grant full rights once recognized
    }

    // Strength-based calculations
    if (strength === 'HALF') {
      return 50;
    }

    if (strength === 'STEP') {
      return 25; // Typically reduced rights for step relationships
    }

    if (strength === 'FOSTER') {
      return 0; // Foster relationships typically don't grant inheritance rights
    }

    // Default to full rights for biological relationships
    if (raw.isBiological) {
      return 100;
    }

    // Default fallback
    return 100;
  }

  /**
   * Safely parses JSON fields
   */
  private parseJsonSafely(jsonField: any): any {
    if (!jsonField) return undefined;

    if (typeof jsonField === 'string') {
      try {
        return JSON.parse(jsonField);
      } catch {
        return undefined;
      }
    }

    return jsonField;
  }

  /**
   * Creates Prisma where clause for finding by ID
   */
  createWhereById(id: string): Prisma.FamilyRelationshipWhereUniqueInput {
    return { id };
  }

  /**
   * Creates Prisma where clause for finding by members
   */
  createWhereByMembers(
    fromMemberId: string,
    toMemberId: string,
  ): Prisma.FamilyRelationshipWhereInput {
    return {
      OR: [
        { fromMemberId, toMemberId },
        { fromMemberId: toMemberId, toMemberId: fromMemberId }, // Handle both directions
      ],
    };
  }

  /**
   * Creates Prisma where clause for finding by family
   */
  createWhereByFamily(familyId: string): Prisma.FamilyRelationshipWhereInput {
    return { familyId };
  }

  /**
   * Creates Prisma where clause for finding by from member
   */
  createWhereByFromMember(fromMemberId: string): Prisma.FamilyRelationshipWhereInput {
    return { fromMemberId };
  }

  /**
   * Creates Prisma where clause for finding by to member
   */
  createWhereByToMember(toMemberId: string): Prisma.FamilyRelationshipWhereInput {
    return { toMemberId };
  }

  /**
   * Creates Prisma where clause for verified relationships
   */
  createWhereVerified(): Prisma.FamilyRelationshipWhereInput {
    return { isVerified: true };
  }

  /**
   * Creates Prisma where clause for next of kin relationships
   */
  createWhereNextOfKin(): Prisma.FamilyRelationshipWhereInput {
    return { isNextOfKin: true };
  }

  /**
   * Creates Prisma where clause for contested relationships
   */
  createWhereContested(): Prisma.FamilyRelationshipWhereInput {
    return { isContested: true };
  }

  /**
   * Creates Prisma where clause for relationships qualifying for inheritance
   */
  createWhereQualifiesForInheritance(): Prisma.FamilyRelationshipWhereInput {
    return {
      OR: [
        { inheritanceRights: 'FULL' },
        { inheritanceRights: 'PARTIAL' },
        { inheritanceRights: 'CUSTOMARY' },
      ],
    };
  }

  /**
   * Creates Prisma where clause for dependant relationships (S.29)
   */
  createWhereDependantRelationship(): Prisma.FamilyRelationshipWhereInput {
    return {
      type: {
        in: ['CHILD', 'ADOPTED_CHILD', 'STEPCHILD', 'SPOUSE', 'PARENT'],
      },
      OR: [{ isBiological: true }, { isAdopted: true }, { type: 'SPOUSE' }],
    };
  }

  /**
   * Creates Prisma include clause for eager loading relationships
   */
  createIncludeClause(): Prisma.FamilyRelationshipInclude {
    return {
      family: true,
      fromMember: true,
      toMember: true,
    };
  }

  /**
   * Validates mapping consistency between domain and persistence
   */
  validateMapping(entity: FamilyRelationship, raw: PrismaFamilyRelationship): boolean {
    const errors: string[] = [];

    // Basic ID validation
    if (entity.id !== raw.id) {
      errors.push(`ID mismatch: Domain=${entity.id}, Persistence=${raw.id}`);
    }

    // Version validation for optimistic concurrency
    if (entity.version !== raw.version) {
      errors.push(`Version mismatch: Domain=${entity.version}, Persistence=${raw.version}`);
    }

    // Validate relationship type
    if (entity.type !== raw.type) {
      errors.push(`Type mismatch: Domain=${entity.type}, Persistence=${raw.type}`);
    }

    // Validate strength
    if (entity.strength !== raw.strength) {
      errors.push(`Strength mismatch: Domain=${entity.strength}, Persistence=${raw.strength}`);
    }

    // Validate inheritance rights type
    const domainRightsType = entity.inheritanceRights.toJSON().type;
    if (domainRightsType !== raw.inheritanceRights) {
      errors.push(
        `Inheritance rights mismatch: Domain=${domainRightsType}, Persistence=${raw.inheritanceRights}`,
      );
    }

    // Validate verification status
    if (entity.isVerified !== raw.isVerified) {
      errors.push(
        `Verification mismatch: Domain=${entity.isVerified}, Persistence=${raw.isVerified}`,
      );
    }

    // Validate next of kin status
    if (entity.isNextOfKin !== raw.isNextOfKin) {
      errors.push(
        `Next of kin mismatch: Domain=${entity.isNextOfKin}, Persistence=${raw.isNextOfKin}`,
      );
    }

    // Validate contested status
    if (entity.isContested !== raw.isContested) {
      errors.push(
        `Contested mismatch: Domain=${entity.isContested}, Persistence=${raw.isContested}`,
      );
    }

    // Validate Kenyan law compliance
    const domainQualifies = entity.qualifiesForInheritance;
    const persistenceQualifies = this.determinesQualifiesForInheritance(raw);

    if (domainQualifies !== persistenceQualifies) {
      errors.push(
        `Inheritance qualification mismatch: Domain=${domainQualifies}, Persistence=${persistenceQualifies}`,
      );
    }

    if (errors.length > 0) {
      console.warn('FamilyRelationship mapping validation errors:', errors);
      return false;
    }

    return true;
  }

  /**
   * Determines inheritance qualification from persistence data
   */
  private determinesQualifiesForInheritance(raw: PrismaFamilyRelationship): boolean {
    const effectiveRights = ['FULL', 'PARTIAL', 'CUSTOMARY'].includes(raw.inheritanceRights);

    // Calculate share percentage based on persistence data
    const sharePercentage = this.calculateSharePercentage(raw, RelationshipTypeVO.create(raw.type));

    return effectiveRights && sharePercentage > 0;
  }

  /**
   * Extracts relationship IDs from Prisma result with includes
   */
  extractRelationships(
    prismaRelationship: PrismaFamilyRelationship & {
      family?: { id: string };
      fromMember?: { id: string };
      toMember?: { id: string };
    },
  ) {
    return {
      familyId: prismaRelationship.family?.id || prismaRelationship.familyId,
      fromMemberId: prismaRelationship.fromMember?.id || prismaRelationship.fromMemberId,
      toMemberId: prismaRelationship.toMember?.id || prismaRelationship.toMemberId,
    };
  }

  /**
   * Creates a batch mapper for multiple family relationships
   */
  toDomainBatch(rawList: PrismaFamilyRelationship[]): FamilyRelationship[] {
    return rawList.map((raw) => this.toDomain(raw)).filter(Boolean) as FamilyRelationship[];
  }

  /**
   * Creates batch persistence data
   */
  toPersistenceBatch(
    entityList: FamilyRelationship[],
  ): Prisma.FamilyRelationshipUncheckedCreateInput[] {
    return entityList.map((entity) => this.toPersistence(entity));
  }

  /**
   * Determines if relationship is active from persistence data
   */
  isActiveInPersistence(raw: PrismaFamilyRelationship): boolean {
    return !raw.relationshipEndDate;
  }

  /**
   * Creates filter for relationships by relationship type
   */
  createTypeFilter(relationshipType: RelationshipType): Prisma.FamilyRelationshipWhereInput {
    return { type: relationshipType };
  }

  /**
   * Creates filter for biological relationships
   */
  createBiologicalFilter(): Prisma.FamilyRelationshipWhereInput {
    return { isBiological: true };
  }

  /**
   * Creates filter for adopted relationships
   */
  createAdoptedFilter(): Prisma.FamilyRelationshipWhereInput {
    return { isAdopted: true };
  }

  /**
   * Creates filter for relationships under customary law
   */
  createCustomaryLawFilter(): Prisma.FamilyRelationshipWhereInput {
    return { recognizedUnderCustomaryLaw: true };
  }

  /**
   * Creates sort order for family relationships
   */
  createSortOrder(
    sortBy: 'type' | 'strength' | 'isNextOfKin' | 'createdAt' = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Prisma.FamilyRelationshipOrderByWithRelationInput {
    return { [sortBy]: order };
  }

  /**
   * Helper to extract relationship statistics from persistence data
   */
  extractStatistics(rawList: PrismaFamilyRelationship[]): {
    total: number;
    biological: number;
    adopted: number;
    verified: number;
    contested: number;
    nextOfKin: number;
    byType: Record<string, number>;
    byInheritanceRights: Record<string, number>;
  } {
    const stats = {
      total: rawList.length,
      biological: 0,
      adopted: 0,
      verified: 0,
      contested: 0,
      nextOfKin: 0,
      byType: {} as Record<string, number>,
      byInheritanceRights: {} as Record<string, number>,
    };

    rawList.forEach((raw) => {
      // Count biological
      if (raw.isBiological) {
        stats.biological++;
      }

      // Count adopted
      if (raw.isAdopted) {
        stats.adopted++;
      }

      // Count verified
      if (raw.isVerified) {
        stats.verified++;
      }

      // Count contested
      if (raw.isContested) {
        stats.contested++;
      }

      // Count next of kin
      if (raw.isNextOfKin) {
        stats.nextOfKin++;
      }

      // Group by type
      stats.byType[raw.type] = (stats.byType[raw.type] || 0) + 1;

      // Group by inheritance rights
      stats.byInheritanceRights[raw.inheritanceRights] =
        (stats.byInheritanceRights[raw.inheritanceRights] || 0) + 1;
    });

    return stats;
  }

  /**
   * Creates where clause for relationships that might be affected by S.29
   */
  createS29ImpactFilter(): Prisma.FamilyRelationshipWhereInput {
    return {
      OR: [
        { type: { in: ['CHILD', 'ADOPTED_CHILD', 'STEPCHILD', 'SPOUSE', 'PARENT'] } },
        {
          isNextOfKin: true,
          nextOfKinPriority: { lte: 3 }, // Primary next of kin
        },
      ],
    };
  }

  /**
   * Helper to normalize partner IDs for queries
   */
  normalizePartnerIds(partner1Id: string, partner2Id: string): [string, string] {
    return [partner1Id, partner2Id].sort();
  }
}

/**
 * Factory for creating FamilyRelationshipMapper with dependency injection support
 */
export class FamilyRelationshipMapperFactory {
  static create(): FamilyRelationshipMapper {
    return new FamilyRelationshipMapper();
  }
}

/**
 * Type guard for Prisma FamilyRelationship with relationships
 */
export function isPrismaFamilyRelationshipWithRelationships(
  relationship: any,
): relationship is PrismaFamilyRelationship & {
  family?: { id: string };
  fromMember?: { id: string };
  toMember?: { id: string };
} {
  return (
    relationship &&
    typeof relationship === 'object' &&
    'id' in relationship &&
    'familyId' in relationship
  );
}

/**
 * Helper to validate relationship type for Kenyan law
 */
export function isValidRelationshipTypeForKenyanLaw(type: RelationshipType): boolean {
  const validTypes = [
    'SPOUSE',
    'EX_SPOUSE',
    'CHILD',
    'ADOPTED_CHILD',
    'STEPCHILD',
    'PARENT',
    'SIBLING',
    'HALF_SIBLING',
    'GRANDCHILD',
    'GRANDPARENT',
    'NIECE_NEPHEW',
    'AUNT_UNCLE',
    'COUSIN',
    'GUARDIAN',
    'OTHER',
  ];
  return validTypes.includes(type);
}

/**
 * Helper to determine if relationship qualifies for inheritance under Kenyan law
 */
export function qualifiesForInheritanceUnderKenyanLaw(
  type: RelationshipType,
  isBiological: boolean,
  isAdopted: boolean,
): boolean {
  // Kenyan Law of Succession Act categories
  const fullRightsTypes: RelationshipType[] = ['SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'PARENT'];

  const partialRightsTypes: RelationshipType[] = ['STEPCHILD', 'SIBLING', 'HALF_SIBLING'];

  const noRightsTypes: RelationshipType[] = [
    'GUARDIAN',
    'COUSIN',
    'AUNT_UNCLE',
    'NIECE_NEPHEW',
    'OTHER',
  ];

  if (fullRightsTypes.includes(type)) {
    return true;
  }

  if (partialRightsTypes.includes(type)) {
    return isBiological || isAdopted;
  }

  if (noRightsTypes.includes(type)) {
    return false;
  }

  // Default: consider for inheritance
  return true;
}
