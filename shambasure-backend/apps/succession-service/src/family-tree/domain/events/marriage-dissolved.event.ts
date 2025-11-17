export class MarriageDissolvedEvent {
  constructor(
    public readonly marriageId: string,
    public readonly familyId: string,
    public readonly dissolvedBy: string,
    public readonly reason: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
