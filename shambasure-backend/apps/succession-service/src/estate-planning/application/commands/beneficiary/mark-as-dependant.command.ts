// commands/beneficiary/mark-as-dependant.command.ts
import { ICommand } from '@nestjs/cqrs';

export class MarkAsDependantCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly correlationId?: string,
  ) {}
}
