export class BeneficiaryRemovedEvent {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly reason?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
