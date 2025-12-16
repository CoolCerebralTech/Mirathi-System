import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  FamilyRelationship as PrismaFamilyRelationship,
  InheritanceRights as PrismaInheritanceRights,
} from '@prisma/client';

import {
  FamilyRelationship,
  FamilyRelationshipProps,
} from '../../../domain/entities/family-relationship.entity';
import {
  InheritanceRights,
  InheritanceRightsType,
} from '../../../domain/value-objects/legal/inheritance-rights.vo';
import { RelationshipTypeVO } from '../../../domain/value-objects/legal/relationship-type.vo';

@Injectable()
export class FamilyRelationshipMapper {
  private readonly logger = new Logger(FamilyRelationshipMapper.name);

  /**
   * Converts Prisma FamilyRelationship to Domain FamilyRelationship entity
   */
  toDomain(raw: PrismaFamilyRelationship | null): FamilyRelationship | null {
    if (!raw) return null;

    try {
      // 1. Reconstitute RelationshipTypeVO
      const relationshipTypeVO = RelationshipTypeVO.create(raw.type);

      // 2. Reconstitute InheritanceRights with fallback logic
      const inheritanceRights = this.reconstituteInheritanceRights(raw, relationshipTypeVO);

      // 3. Safe JSON Parsing
      // Prisma JsonValue can be object, array, or primitive. We ensure it's handled safely.
      const verificationDocuments =
        raw.verificationDocuments && typeof raw.verificationDocuments === 'object'
          ? raw.verificationDocuments
          : undefined;

      const customaryCeremonyDetails =
        raw.customaryCeremonyDetails && typeof raw.customaryCeremonyDetails === 'object'
          ? raw.customaryCeremonyDetails
          : undefined;

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
        adoptionDate: raw.adoptionDate ?? undefined,
        isCustomaryAdoption: raw.isCustomaryAdoption,
        strength: raw.strength,
        relationshipStartDate: raw.relationshipStartDate ?? undefined,
        relationshipEndDate: raw.relationshipEndDate ?? undefined,
        endReason: raw.endReason ?? undefined,
        isVerified: raw.isVerified,
        verificationMethod: raw.verificationMethod ?? undefined,
        verificationDocuments,
        verifiedAt: raw.verifiedAt ?? undefined,
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
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };

      return FamilyRelationship.createFromProps(props);
    } catch (error) {
      this.logger.error(`Failed to reconstitute FamilyRelationship ${raw?.id}`, error.stack);
      throw new Error(`Data integrity error for FamilyRelationship ${raw?.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain Entity to Persistence Input
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
      adoptionOrderNumber: props.adoptionOrderNumber ?? null,
      adoptionCourt: props.adoptionCourt ?? null,
      adoptionDate: props.adoptionDate ?? null,
      isCustomaryAdoption: props.isCustomaryAdoption,
      strength: props.strength,

      // Inheritance Rights mapped to Enum
      inheritanceRights: props.inheritanceRights.rightsType as PrismaInheritanceRights,

      relationshipStartDate: props.relationshipStartDate ?? null,
      relationshipEndDate: props.relationshipEndDate ?? null,
      endReason: props.endReason ?? null,

      isVerified: props.isVerified,
      verificationMethod: props.verificationMethod ?? null,
      verificationDocuments: props.verificationDocuments ?? Prisma.JsonNull,
      verifiedAt: props.verifiedAt ?? null,
      verifiedBy: props.verifiedBy ?? null,

      isNextOfKin: props.isNextOfKin,
      nextOfKinPriority: props.nextOfKinPriority,

      recognizedUnderCustomaryLaw: props.recognizedUnderCustomaryLaw,
      customaryCeremonyDetails: props.customaryCeremonyDetails ?? Prisma.JsonNull,

      isContested: props.isContested,
      contestationCaseNumber: props.contestationCaseNumber ?? null,
      courtValidated: props.courtValidated,

      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates Prisma Update Input
   */
  toPrismaUpdate(entity: FamilyRelationship): Prisma.FamilyRelationshipUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      isVerified: props.isVerified,
      verificationMethod: props.verificationMethod ?? null,
      verificationDocuments: props.verificationDocuments ?? Prisma.JsonNull,
      verifiedAt: props.verifiedAt ?? null,
      verifiedBy: props.verifiedBy ?? null,

      inheritanceRights: props.inheritanceRights.rightsType as PrismaInheritanceRights,
      strength: props.strength,

      relationshipStartDate: props.relationshipStartDate ?? null,
      relationshipEndDate: props.relationshipEndDate ?? null,
      endReason: props.endReason ?? null,

      isNextOfKin: props.isNextOfKin,
      nextOfKinPriority: props.nextOfKinPriority,

      recognizedUnderCustomaryLaw: props.recognizedUnderCustomaryLaw,
      customaryCeremonyDetails: props.customaryCeremonyDetails ?? Prisma.JsonNull,

      isContested: props.isContested,
      contestationCaseNumber: props.contestationCaseNumber ?? null,
      courtValidated: props.courtValidated,

      version: props.version,
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
    // Cast Prisma Enum to Domain Type safely
    const rightsType = raw.inheritanceRights as InheritanceRightsType;

    // Determine share percentage based on relationship type and strength
    const sharePercentage = this.calculateSharePercentage(raw);

    return InheritanceRights.create(rightsType, relationshipTypeVO, sharePercentage);
  }

  /**
   * Calculates share percentage logic for reconstitution
   */
  private calculateSharePercentage(raw: PrismaFamilyRelationship): number {
    const { type, strength, isAdopted, isCustomaryAdoption } = raw;

    // Full Disinheritance Logic
    const noRightsTypes: string[] = ['GUARDIAN', 'OTHER', 'COUSIN', 'AUNT_UNCLE', 'NIECE_NEPHEW'];
    if (noRightsTypes.includes(type)) return 0;

    // Adopted Child overrides
    if (isAdopted) return 100;
    if (isCustomaryAdoption && strength === 'ADOPTED') return 100;

    // Partial Rights
    if (type === 'STEPCHILD' || type === 'EX_SPOUSE' || strength === 'HALF') return 50;
    if (strength === 'STEP') return 25;
    if (strength === 'FOSTER') return 0;

    return 100; // Default Full
  }

  // --- QUERY HELPERS ---

  createWhereByMembers(
    fromMemberId: string,
    toMemberId: string,
  ): Prisma.FamilyRelationshipWhereInput {
    return {
      OR: [
        { fromMemberId, toMemberId },
        { fromMemberId: toMemberId, toMemberId: fromMemberId },
      ],
    };
  }

  createWhereByFamily(familyId: string): Prisma.FamilyRelationshipWhereInput {
    return { familyId };
  }
}
