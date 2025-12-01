// commands/beneficiary/require-court-approval.command.ts
import { ICommand } from '@nestjs/cqrs';

import { RequireCourtApprovalDto } from '../../dto/requests/require-court-approval.dto';

export class RequireCourtApprovalCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly data: RequireCourtApprovalDto,
    public readonly correlationId?: string,
  ) {}
}
