export class BeneficiaryUpdatedEvent {
  constructor(
    public readonly beneficiaryId: string,
    public readonly willId: string,
    public readonly assetId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
