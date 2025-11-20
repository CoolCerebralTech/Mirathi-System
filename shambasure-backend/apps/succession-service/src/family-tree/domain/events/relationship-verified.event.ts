// succession-service/src/family-tree/domain/events/relationship-verified.event.ts

export class RelationshipVerifiedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly verifiedBy: string, // Admin or User ID
    public readonly verificationMethod:
      | 'BIRTH_CERTIFICATE'
      | 'AFFIDAVIT'
      | 'DNA_TEST'
      | 'COMMUNITY_RECOGNITION',
    public readonly timestamp: Date = new Date(),
  ) {}
}
