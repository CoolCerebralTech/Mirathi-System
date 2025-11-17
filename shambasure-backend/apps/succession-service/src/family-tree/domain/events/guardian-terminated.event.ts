export class GuardianTerminatedEvent {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly wardId: string,
    public readonly reason: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
