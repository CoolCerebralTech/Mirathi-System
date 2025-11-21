export class RelationshipVerifiedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly verifiedBy: string, // Admin or User ID
    public readonly verificationMethod:
      | 'BIRTH_CERTIFICATE'
      | 'AFFIDAVIT'
      | 'DNA_TEST'
      | 'COMMUNITY_RECOGNITION'
      | 'COURT_ORDER',
    public readonly verificationNotes?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
