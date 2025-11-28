import { FamilyMember as PrismaFamilyMember } from '@prisma/client';
import {
  FamilyMember,
  MemberContactInfo,
  KenyanIdentification,
  KenyanFamilyMemberMetadata,
} from '../../../domain/entities/family-member.entity';

export class FamilyMemberMapper {
  static toDomain(raw: PrismaFamilyMember): FamilyMember {
    // Construct defaults for missing schema columns
    const contactInfo: MemberContactInfo = {
      email: raw.email || undefined,
      phone: raw.phone || undefined,
    };

    const kenyanId: KenyanIdentification = {};
    const metadata: KenyanFamilyMemberMetadata = {
      isFamilyHead: false,
      isElder: false,
      dependencyStatus: 'INDEPENDENT',
    };

    const gender = 'OTHER';

    return FamilyMember.reconstitute({
      id: raw.id,
      familyId: raw.familyId,
      firstName: raw.firstName || 'Unknown',
      lastName: raw.lastName || 'Member',

      // FIX: Direct assignment since Entity uses the same Prisma Enum
      role: raw.role,

      addedBy: raw.addedBy,
      userId: raw.userId,

      dateOfBirth: raw.dateOfBirth,
      dateOfDeath: raw.dateOfDeath,
      isDeceased: raw.isDeceased,
      isMinor: raw.isMinor,

      contactInfo: contactInfo,
      notes: raw.notes,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,

      kenyanIdentification: kenyanId,
      metadata: metadata,
      gender: gender,
      middleName: undefined,
    });
  }

  static toPersistence(entity: FamilyMember): PrismaFamilyMember {
    const contact = entity.getContactInfo();

    return {
      id: entity.getId(),
      familyId: entity.getFamilyId(),
      userId: entity.getUserId() || null,

      firstName: entity.getFirstName(),
      lastName: entity.getLastName(),

      email: contact.email || null,
      phone: contact.phone || null,

      dateOfBirth: entity.getDateOfBirth(),
      dateOfDeath: entity.getDateOfDeath(),

      relationshipTo: null,

      // FIX: Direct assignment
      role: entity.getRole(),

      isMinor: entity.getIsMinor(),
      isDeceased: entity.getIsDeceased(),

      notes: entity.getNotes() || null,
      addedBy: entity.getAddedBy(),

      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
      deletedAt: entity.getDeletedAt(),
    };
  }
}
