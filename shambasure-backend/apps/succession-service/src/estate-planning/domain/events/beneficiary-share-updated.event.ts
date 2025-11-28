import { BequestType } from '@prisma/client';

export class BeneficiaryShareUpdatedEvent {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly bequestType: BequestType,
    // Primitives used instead of Value Objects for serialization
    public readonly sharePercentage: number | null,
    public readonly specificAmount: number | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
