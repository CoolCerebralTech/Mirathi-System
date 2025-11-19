import { BequestConditionType } from '@prisma/client';

export class BeneficiaryConditionAddedEvent {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly conditionType: BequestConditionType,
    public readonly conditionDetails: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
