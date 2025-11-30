import { Prisma, FamilyRelationship as PrismaRelationship } from '@prisma/client';

import {
  Relationship,
  RelationshipReconstitutionProps,
} from '../../../domain/entities/relationship.entity';

export class RelationshipMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaRelationship): Relationship {
    const reconstitutionProps: RelationshipReconstitutionProps = {
      id: raw.id,
      familyId: raw.familyId,
      fromMemberId: raw.fromMemberId,
      toMemberId: raw.toMemberId,
      type: raw.type,

      // Kenyan Metadata
      isAdopted: raw.isAdopted,
      adoptionOrderNumber: raw.adoptionOrderNumber,
      isBiological: raw.isBiological,
      bornOutOfWedlock: raw.bornOutOfWedlock,
      clanRelationship: raw.clanRelationship,
      traditionalRole: raw.traditionalRole,
      isCustomaryAdoption: raw.isCustomaryAdoption,
      adoptionDate: raw.adoptionDate,
      guardianshipType: raw.guardianshipType,
      courtOrderNumber: raw.courtOrderNumber,
      dependencyLevel: raw.dependencyLevel,
      inheritanceRights: raw.inheritanceRights,
      traditionalInheritanceWeight: raw.traditionalInheritanceWeight,

      // Verification
      isVerified: raw.isVerified,
      verificationMethod: raw.verificationMethod,
      verifiedAt: raw.verifiedAt,
      verifiedBy: raw.verifiedBy,
      verificationNotes: raw.verificationNotes,
      verificationDocuments: raw.verificationDocuments,

      // Timestamps
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return Relationship.reconstitute(reconstitutionProps);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Relationship): PrismaRelationship {
    return {
      id: entity.getId(),
      familyId: entity.getFamilyId(),
      fromMemberId: entity.getFromMemberId(),
      toMemberId: entity.getToMemberId(),
      type: entity.getType(),

      // Kenyan Metadata
      isAdopted: entity.getIsAdopted(),
      adoptionOrderNumber: entity.getAdoptionOrderNumber(),
      isBiological: entity.getIsBiological(),
      bornOutOfWedlock: entity.getBornOutOfWedlock(),
      clanRelationship: entity.getClanRelationship(),
      traditionalRole: entity.getTraditionalRole(),
      isCustomaryAdoption: entity.getIsCustomaryAdoption(),
      adoptionDate: entity.getAdoptionDate(),
      guardianshipType: entity.getGuardianshipType(),
      courtOrderNumber: entity.getCourtOrderNumber(),
      dependencyLevel: entity.getDependencyLevel(),
      inheritanceRights: entity.getInheritanceRights(),
      traditionalInheritanceWeight: entity.getTraditionalInheritanceWeight(),

      // Verification
      isVerified: entity.getIsVerified(),
      verificationMethod: entity.getVerificationMethod(),
      verifiedAt: entity.getVerifiedAt(),
      verifiedBy: entity.getVerifiedBy(),
      verificationNotes: entity.getVerificationNotes(),
      verificationDocuments: entity.getVerificationDocuments(),

      // Timestamps
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    } as PrismaRelationship;
  }

  /**
   * Converts Domain Entity to Prisma Create input
   */
  static toPrismaCreate(
    entity: Relationship,
    familyId: string,
  ): Prisma.FamilyRelationshipCreateInput {
    return {
      id: entity.getId(),
      family: {
        connect: { id: familyId },
      },
      fromMember: {
        connect: { id: entity.getFromMemberId() },
      },
      toMember: {
        connect: { id: entity.getToMemberId() },
      },
      type: entity.getType(),

      // Kenyan Metadata
      isAdopted: entity.getIsAdopted(),
      adoptionOrderNumber: entity.getAdoptionOrderNumber(),
      isBiological: entity.getIsBiological(),
      bornOutOfWedlock: entity.getBornOutOfWedlock(),
      clanRelationship: entity.getClanRelationship(),
      traditionalRole: entity.getTraditionalRole(),
      isCustomaryAdoption: entity.getIsCustomaryAdoption(),
      adoptionDate: entity.getAdoptionDate(),
      guardianshipType: entity.getGuardianshipType(),
      courtOrderNumber: entity.getCourtOrderNumber(),
      dependencyLevel: entity.getDependencyLevel(),
      inheritanceRights: entity.getInheritanceRights(),
      traditionalInheritanceWeight: entity.getTraditionalInheritanceWeight(),

      // Verification
      isVerified: entity.getIsVerified(),
      verificationMethod: entity.getVerificationMethod(),
      verifiedAt: entity.getVerifiedAt(),
      verifiedBy: entity.getVerifiedBy(),
      verificationNotes: entity.getVerificationNotes(),
      verificationDocuments: entity.getVerificationDocuments(),

      // Timestamps - Prisma will handle createdAt/updatedAt
    };
  }

  /**
   * Converts Domain Entity to Prisma Update input
   */
  static toPrismaUpdate(entity: Relationship): Prisma.FamilyRelationshipUpdateInput {
    return {
      // Kenyan Metadata
      isAdopted: entity.getIsAdopted(),
      adoptionOrderNumber: entity.getAdoptionOrderNumber(),
      isBiological: entity.getIsBiological(),
      bornOutOfWedlock: entity.getBornOutOfWedlock(),
      clanRelationship: entity.getClanRelationship(),
      traditionalRole: entity.getTraditionalRole(),
      isCustomaryAdoption: entity.getIsCustomaryAdoption(),
      adoptionDate: entity.getAdoptionDate(),
      guardianshipType: entity.getGuardianshipType(),
      courtOrderNumber: entity.getCourtOrderNumber(),
      dependencyLevel: entity.getDependencyLevel(),
      inheritanceRights: entity.getInheritanceRights(),
      traditionalInheritanceWeight: entity.getTraditionalInheritanceWeight(),

      // Verification
      isVerified: entity.getIsVerified(),
      verificationMethod: entity.getVerificationMethod(),
      verifiedAt: entity.getVerifiedAt(),
      verifiedBy: entity.getVerifiedBy(),
      verificationNotes: entity.getVerificationNotes(),
      verificationDocuments: entity.getVerificationDocuments(),

      // Timestamps
      updatedAt: entity.getUpdatedAt(),
    };
  }
}
