// commands/beneficiary/obtain-court-approval.command.ts
import { ICommand } from '@nestjs/cqrs';

import { ObtainCourtApprovalDto } from '../../dto/requests/obtain-court-approval.dto';

export class ObtainCourtApprovalCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly data: ObtainCourtApprovalDto,
    public readonly correlationId?: string,
  ) {}
}
