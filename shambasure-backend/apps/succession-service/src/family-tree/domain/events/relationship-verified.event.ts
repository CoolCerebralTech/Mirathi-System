export class RelationshipVerifiedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly verifiedBy: string, // Admin or User ID
    public readonly verificationMethod: string, // e.g. 'BIRTH_CERTIFICATE', 'AFFIDAVIT', 'OTHER'
    public readonly verificationNotes?: string | null,
    public readonly verificationDocuments?: string[], // List of Document IDs
    public readonly timestamp: Date = new Date(),
  ) {}
}
