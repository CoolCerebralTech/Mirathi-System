export class FamilyMetadataUpdatedEvent {
  constructor(
    public readonly familyId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
