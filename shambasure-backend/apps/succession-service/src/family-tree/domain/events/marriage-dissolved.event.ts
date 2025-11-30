export class MarriageDissolvedEvent {
  constructor(
    public readonly marriageId: string,
    public readonly familyId: string,
    public readonly spouse1Id: string,
    public readonly spouse2Id: string,
    public readonly dissolutionDate: Date,
    // Specific legal dissolution type (Divorce, Annulment, Death, Customary)
    public readonly dissolutionType: string,
    // Legal Proof
    public readonly certificateNumber?: string | null,
    public readonly courtOrderNumber?: string | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
