// commands/beneficiary/set-alternate-beneficiary.command.ts
import { ICommand } from '@nestjs/cqrs';

import { SetAlternateBeneficiaryDto } from '../../dto/requests/set-alternate-beneficiary.dto';

export class SetAlternateBeneficiaryCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly data: SetAlternateBeneficiaryDto,
    public readonly correlationId?: string,
  ) {}
}
