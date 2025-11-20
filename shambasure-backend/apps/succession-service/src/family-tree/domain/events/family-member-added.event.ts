export class FamilyMemberAddedEvent {
  constructor(
    public readonly familyMemberId: string,
    public readonly familyId: string,
    public readonly name: string,
    public readonly role: string, // RelationshipType Code
    public readonly userId?: string, // If they are a registered user
    public readonly timestamp: Date = new Date(),
  ) {}
}
