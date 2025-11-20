import { FamilyMember as PrismaMember } from '@prisma/client';
import { FamilyMember, MemberContactInfo } from '../../../domain/entities/family-member.entity';

export class FamilyMemberMapper {
  static toPersistence(domain: FamilyMember): PrismaMember {
    const contact = domain.getContactInfo();

    return {
      id: domain.getId(),
      familyId: domain.getFamilyId(),
      userId: domain.getUserId() || null,

      // Direct mapping matching new Schema
      firstName: domain.getFirstName(),
      lastName: domain.getLastName(),

      role: domain.getRole(),
      relationshipTo: null, // Context field

      dateOfBirth: domain.getDateOfBirth(),
      dateOfDeath: domain.getDateOfDeath(),
      isDeceased: domain.getIsDeceased(),
      isMinor: domain.getIsMinor(),

      email: contact.email || null,
      phone: contact.phone || null,

      notes: domain.getNotes(),
      addedBy: domain.getAddedBy(),

      createdAt: domain.getCreatedAt(), // Usually ignored on update
      updatedAt: new Date(),
      deletedAt: domain.getDeletedAt(),
    } as unknown as PrismaMember;
  }

  static toDomain(raw: PrismaMember): FamilyMember {
    const contactInfo: MemberContactInfo = {
      email: raw.email || undefined,
      phone: raw.phone || undefined,
    };

    return FamilyMember.reconstitute({
      id: raw.id,
      familyId: raw.familyId,
      userId: raw.userId,

      // Direct mapping
      firstName: raw.firstName,
      lastName: raw.lastName,

      role: raw.role,
      addedBy: raw.addedBy,

      dateOfBirth: raw.dateOfBirth,
      dateOfDeath: raw.dateOfDeath,
      isDeceased: raw.isDeceased,
      isMinor: raw.isMinor,
      relationshipTo: raw.relationshipTo,

      contactInfo: contactInfo,
      notes: raw.notes,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }
}
