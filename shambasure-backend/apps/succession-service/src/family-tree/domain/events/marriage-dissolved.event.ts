export class MarriageDissolvedEvent {
  constructor(
    public readonly marriageId: string,
    public readonly familyId: string,
    public readonly spouse1Id: string,
    public readonly spouse2Id: string,
    public readonly divorceDate: Date,
    public readonly reason?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
