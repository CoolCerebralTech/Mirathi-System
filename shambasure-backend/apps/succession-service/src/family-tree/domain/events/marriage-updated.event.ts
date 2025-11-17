export class MarriageUpdatedEvent {
  constructor(
    public readonly marriageId: string,
    public readonly familyId: string,
    public readonly updatedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
