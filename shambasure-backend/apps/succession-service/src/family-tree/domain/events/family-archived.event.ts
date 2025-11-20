export class FamilyArchivedEvent {
  constructor(
    public readonly familyId: string,
    public readonly archivedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
