// commands/beneficiary/transfer-beneficiary-entitlement.command.ts
import { ICommand } from '@nestjs/cqrs';

export class TransferBeneficiaryEntitlementCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly newBeneficiaryAssignmentId: string,
    public readonly transferReason: string,
    public readonly correlationId?: string,
  ) {}
}
