export class BeneficiaryLifeInterestSetEvent {
  constructor(
    public readonly beneficiaryId: string,
    public readonly willId: string,
    public readonly beneficiaryIdentifier: string,
    public readonly durationMonths: number | undefined,
    public readonly endsAt: Date | null,
  ) {}
}
