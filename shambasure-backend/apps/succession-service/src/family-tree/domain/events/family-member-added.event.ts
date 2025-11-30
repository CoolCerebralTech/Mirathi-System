import { RelationshipType } from '@prisma/client';

export class FamilyMemberAddedEvent {
  constructor(
    public readonly familyId: string,
    public readonly memberDetails: {
      memberId: string; // The UUID of the FamilyMember entity
      userId?: string; // Optional: If linked to a registered User
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
      isDeceased: boolean;
      dateOfDeath?: Date;
      isMinor: boolean;
      role: RelationshipType; // Strict Enum
      relationshipTo?: string; // Descriptive text (e.g. "Father of John")
    },
    public readonly timestamp: Date = new Date(),
  ) {}
}
