export class GuardianUpdatedEvent {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly wardId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
