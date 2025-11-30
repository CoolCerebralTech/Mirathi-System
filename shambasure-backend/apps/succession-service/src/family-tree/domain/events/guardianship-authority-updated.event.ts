export class GuardianshipAuthorityUpdatedEvent {
  constructor(
    public readonly guardianshipId: string,
    public readonly updateDetails: {
      previousExpiry?: Date;
      newExpiry: Date;
      reason: string;
      authorizedBy: string;
      courtOrderNumber?: string;
    },
    public readonly timestamp: Date = new Date(),
  ) {}
}
