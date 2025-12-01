// commands/beneficiary/mark-beneficiary-distributed.command.ts
import { ICommand } from '@nestjs/cqrs';

import { MarkBeneficiaryDistributedDto } from '../../dto/requests/mark-beneficiary-distributed.dto';

export class MarkBeneficiaryDistributedCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly data: MarkBeneficiaryDistributedDto,
    public readonly correlationId?: string,
  ) {}
}
