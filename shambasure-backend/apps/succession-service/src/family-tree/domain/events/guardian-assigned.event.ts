export class GuardianAssignedEvent {
  constructor(
    public readonly familyId: string,
    public readonly guardianDetails: {
      guardianId: string;
      wardId: string;
      guardianType: string;
      appointedBy: 'court' | 'family' | 'will';
      validUntil?: Date;
      appointmentDate: Date;
      notes?: string;
    },
  ) {}

  getEventType(): string {
    return 'GuardianAssignedEvent';
  }

  getEventVersion(): number {
    return 1;
  }
}
