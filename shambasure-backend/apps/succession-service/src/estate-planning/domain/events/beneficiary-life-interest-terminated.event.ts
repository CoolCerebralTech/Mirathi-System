export class BeneficiaryLifeInterestTerminatedEvent {
  constructor(
    public readonly beneficiaryId: string,
    public readonly willId: string,
    public readonly beneficiaryIdentifier: string,
    public readonly reason: string,
    public readonly previousEndDate: Date | null,
  ) {}
}
