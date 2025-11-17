export class FamilyUpdatedEvent {
  constructor(
    public readonly familyId: string,
    public readonly updatedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
