// commands/beneficiary/update-beneficiary-priority.command.ts
import { ICommand } from '@nestjs/cqrs';
import { BequestPriority } from '@prisma/client';

export class UpdateBeneficiaryPriorityCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly priority: number,
    public readonly bequestPriority: BequestPriority,
    public readonly correlationId?: string,
  ) {}
}
