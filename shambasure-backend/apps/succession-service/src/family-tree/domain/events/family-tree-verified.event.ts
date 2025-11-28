export class FamilyTreeVerifiedEvent {
  constructor(public readonly familyId: string) {}

  getEventType(): string {
    return 'FamilyTreeVerifiedEvent';
  }

  getEventVersion(): number {
    return 1;
  }
}
