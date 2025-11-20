export class FamilyCreatedEvent {
  constructor(
    public readonly familyId: string,
    public readonly ownerId: string, // The User who started the tree
    public readonly name: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
