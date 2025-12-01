// commands/beneficiary/remove-beneficiary.command.ts
import { ICommand } from '@nestjs/cqrs';

import { RemoveBeneficiaryDto } from '../../dto/requests/remove-beneficiary.dto';

export class RemoveBeneficiaryCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly data: RemoveBeneficiaryDto,
    public readonly correlationId?: string,
  ) {}
}
