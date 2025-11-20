export class FamilyTreeVisualizationUpdatedEvent {
  constructor(
    public readonly familyId: string,
    // Payload size might be large, so we might store a reference or just the fact it updated
    public readonly timestamp: Date = new Date(),
  ) {}
}
