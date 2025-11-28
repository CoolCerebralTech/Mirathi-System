export class BeneficiaryDistributedEvent {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly assetId: string,
    public readonly distributedDate: Date,
    public readonly distributionMethod: string | null, // e.g. "Bank Transfer", "Title Transfer"
    public readonly timestamp: Date = new Date(),
  ) {}
}
