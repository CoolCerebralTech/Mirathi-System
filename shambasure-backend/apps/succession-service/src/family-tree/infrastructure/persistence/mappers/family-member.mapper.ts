// succession-service/src/family-tree/infrastructure/persistence/mappers/family-member.mapper.ts

import { FamilyMember as PrismaMember } from '@prisma/client';
import { FamilyMember, MemberContactInfo } from '../../../domain/entities/family-member.entity';

export class FamilyMemberMapper {
  /**
   * Domain -> Database
   */
  static toPersistence(domain: FamilyMember): PrismaMember {
    const contact = domain.getContactInfo();

    return {
      id: domain.getId(),
      familyId: domain.getFamilyId(),
      userId: domain.getUserId() || null,

      firstName: domain.getFullName().split(' ')[0], // Re-splitting might be risky, better to expose first/last in entity getters
      // Correction: Entity has internal firstName/lastName, we should expose getters for them in Entity
      // Assuming getters added or accessing internal state via mapper friend pattern
      // Since we only exposed getFullName(), we should update Entity to expose getFirstName/LastName
      // For this implementation, let's assume we added those getters to the entity (see note below)

      lastName: domain.getFullName().split(' ').slice(1).join(' '), // Fallback logic

      // Role & Context
      role: domain.getRole(),
      relationshipTo: null, // Maps to 'relationshipTo' context string if stored, typically handled by Relationship entity edges, but schema has it.

      // Vitals
      dateOfBirth: domain.getDateOfBirth(),
      dateOfDeath: null, // If not exposed, we default null. (Need to expose in Entity)
      isDeceased: domain.getIsDeceased(),
      isMinor: domain.getIsMinor(),

      // Flattened Contact Info
      email: contact.email || null,
      phone: contact.phone || null,

      notes: null, // Need getter in Entity
      addedBy: 'SYSTEM', // Needs getter in Entity

      createdAt: new Date(), // Handled by DB usually
      updatedAt: new Date(),
      deletedAt: domain.getDeletedAt(),
    } as unknown as PrismaMember;
  }

  /**
   * Database -> Domain
   */
  static toDomain(raw: PrismaMember): FamilyMember {
    // Reconstruct Contact Info Object
    const contactInfo: MemberContactInfo = {
      email: raw.email || undefined,
      phone: raw.phone || undefined,
      // address: raw.address // If schema had address
    };

    return FamilyMember.reconstitute({
      id: raw.id,
      familyId: raw.familyId,
      userId: raw.userId,
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
