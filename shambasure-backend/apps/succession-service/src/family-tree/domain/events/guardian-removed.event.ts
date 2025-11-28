export class GuardianRemovedEvent {
  constructor(
    public readonly guardianshipId: string,
    public readonly familyId: string,
    public readonly guardianId: string,
    public readonly wardId: string,
    public readonly reason: string,
    public readonly revokedBy?: string,
    public readonly courtOrderNumber?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
