// succession-service/src/family-tree/domain/events/family-member-updated.event.ts

export class FamilyMemberUpdatedEvent {
  constructor(
    public readonly familyMemberId: string,
    public readonly familyId: string,
    public readonly changes: Record<string, any>, // Audit log of what changed
    public readonly timestamp: Date = new Date(),
  ) {}
}
