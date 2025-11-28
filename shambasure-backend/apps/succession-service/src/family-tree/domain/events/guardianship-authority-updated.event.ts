export class GuardianshipAuthorityUpdatedEvent {
  constructor(
    public readonly guardianshipId: string,
    public readonly familyId: string,
    public readonly updateDetails: {
      previousExpiry: Date | null;
      newExpiry: Date;
      reason: string;
      authorizedBy: string;
      courtOrderNumber?: string;
    },
  ) {}

  getEventType(): string {
    return 'GuardianshipAuthorityUpdatedEvent';
  }

  getEventVersion(): number {
    return 1;
  }
}
