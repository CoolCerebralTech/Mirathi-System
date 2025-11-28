export class FamilyMemberAddedEvent {
  constructor(
    public readonly familyId: string,
    public readonly memberDetails: {
      memberId: string;
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
      isDeceased?: boolean;
      dateOfDeath?: Date;
      isMinor: boolean;
      gender?: 'MALE' | 'FEMALE';
      nationalId?: string;
    },
  ) {}

  getEventType(): string {
    return 'FamilyMemberAddedEvent';
  }

  getEventVersion(): number {
    return 1;
  }
}
