// commands/beneficiary/mark-condition-met.command.ts
import { ICommand } from '@nestjs/cqrs';

export class MarkConditionMetCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly correlationId?: string,
  ) {}
}
