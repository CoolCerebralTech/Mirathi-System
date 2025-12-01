// commands/beneficiary/remove-beneficiary-condition.command.ts
import { ICommand } from '@nestjs/cqrs';

export class RemoveBeneficiaryConditionCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly correlationId?: string,
  ) {}
}
