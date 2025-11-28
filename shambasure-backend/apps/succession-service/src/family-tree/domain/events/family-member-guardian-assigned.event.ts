export class FamilyMemberGuardianAssignedEvent {
  constructor(
    public readonly familyMemberId: string,
    public readonly familyId: string,
    public readonly guardianDetails: {
      guardianType: string;
      appointedBy: string;
      validUntil?: Date;
      courtOrderNumber?: string;
      appointmentDate: Date;
    },
  ) {}

  getEventType(): string {
    return 'FamilyMemberGuardianAssignedEvent';
  }

  getEventVersion(): number {
    return 1;
  }
}
