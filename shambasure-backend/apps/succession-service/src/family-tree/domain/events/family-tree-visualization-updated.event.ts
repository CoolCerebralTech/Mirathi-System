export class FamilyTreeVisualizationUpdatedEvent {
  constructor(
    public readonly familyId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
