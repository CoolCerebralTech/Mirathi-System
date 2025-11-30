export class FamilyHeadAppointedEvent {
  constructor(
    public readonly familyId: string,
    public readonly familyHeadId: string,
    public readonly appointedBy: string,
    public readonly familyHeadName: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
