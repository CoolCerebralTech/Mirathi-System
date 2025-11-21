export class FamilyMemberMarkedDeceasedEvent {
  constructor(
    public readonly familyMemberId: string,
    public readonly familyId: string,
    public readonly dateOfDeath: Date,
    public readonly markedBy: string,
    public readonly deathCertificateNumber?: string, // optional string
    public readonly timestamp: Date = new Date(),
  ) {}
}
