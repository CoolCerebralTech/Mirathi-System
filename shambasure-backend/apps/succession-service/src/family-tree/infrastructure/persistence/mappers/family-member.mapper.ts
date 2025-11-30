import { FamilyMember as PrismaFamilyMember } from '@prisma/client';

import {
  FamilyMember,
  FamilyMemberReconstitutionProps,
} from '../../../domain/entities/family-member.entity';

export class FamilyMemberMapper {
  static toDomain(raw: PrismaFamilyMember): FamilyMember {
    const reconstitutionProps: FamilyMemberReconstitutionProps = {
      id: raw.id,
      familyId: raw.familyId,

      // Core Identity
      userId: raw.userId,
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      phone: raw.phone,
      dateOfBirth: raw.dateOfBirth,
      dateOfDeath: raw.dateOfDeath,

      // Relationship context
      relationshipTo: raw.relationshipTo,
      role: raw.role,

      // Legal status
      isMinor: raw.isMinor,
      isDeceased: raw.isDeceased,

      // Metadata
      notes: raw.notes,
      addedBy: raw.addedBy,

      // Timestamps
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };

    return FamilyMember.reconstitute(reconstitutionProps);
  }

  static toPersistence(entity: FamilyMember): PrismaFamilyMember {
    return {
      id: entity.getId(),
      familyId: entity.getFamilyId(),

      // Core Identity
      userId: entity.getUserId(),
      firstName: entity.getFirstName(),
      lastName: entity.getLastName(),
      email: entity.getEmail(),
      phone: entity.getPhone(),
      dateOfBirth: entity.getDateOfBirth(),
      dateOfDeath: entity.getDateOfDeath(),

      // Relationship context
      relationshipTo: entity.getRelationshipTo(),
      role: entity.getRole(),

      // Legal status
      isMinor: entity.getIsMinor(),
      isDeceased: entity.getIsDeceased(),

      // Metadata
      notes: entity.getNotes(),
      addedBy: entity.getAddedBy(),

      // Timestamps
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
      deletedAt: entity.getDeletedAt(),
    } as PrismaFamilyMember;
  }

  /**
   * Converts Domain Entity to Prisma Create input
   */
  static toPrismaCreate(entity: FamilyMember, familyId: string): any {
    return {
      id: entity.getId(),
      family: {
        connect: { id: familyId },
      },

      // Core Identity
      userId: entity.getUserId() ? { connect: { id: entity.getUserId() } } : undefined,
      firstName: entity.getFirstName(),
      lastName: entity.getLastName(),
      email: entity.getEmail(),
      phone: entity.getPhone(),
      dateOfBirth: entity.getDateOfBirth(),
      dateOfDeath: entity.getDateOfDeath(),

      // Relationship context
      relationshipTo: entity.getRelationshipTo(),
      role: entity.getRole(),

      // Legal status
      isMinor: entity.getIsMinor(),
      isDeceased: entity.getIsDeceased(),

      // Metadata
      notes: entity.getNotes(),
      addedBy: entity.getAddedBy(),

      // Timestamps - Prisma will handle createdAt/updatedAt
      deletedAt: entity.getDeletedAt(),
    };
  }

  /**
   * Converts Domain Entity to Prisma Update input
   */
  static toPrismaUpdate(entity: FamilyMember): any {
    return {
      // Core Identity
      firstName: entity.getFirstName(),
      lastName: entity.getLastName(),
      email: entity.getEmail(),
      phone: entity.getPhone(),
      dateOfBirth: entity.getDateOfBirth(),
      dateOfDeath: entity.getDateOfDeath(),

      // Relationship context
      relationshipTo: entity.getRelationshipTo(),
      role: entity.getRole(),

      // Legal status
      isMinor: entity.getIsMinor(),
      isDeceased: entity.getIsDeceased(),

      // Metadata
      notes: entity.getNotes(),

      // Timestamps
      updatedAt: entity.getUpdatedAt(),
      deletedAt: entity.getDeletedAt(),
    };
  }
}
