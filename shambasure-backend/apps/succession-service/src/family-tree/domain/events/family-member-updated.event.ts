export class FamilyMemberUpdatedEvent {
  constructor(
    public readonly familyMemberId: string,
    public readonly familyId: string,
    // Flexible record to handle various update types (details, linking user, relationship change)
    public readonly changes: Record<string, any>,
    public readonly timestamp: Date = new Date(),
  ) {}
}
