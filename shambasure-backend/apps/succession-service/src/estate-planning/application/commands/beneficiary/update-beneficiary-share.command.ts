// commands/beneficiary/update-beneficiary-share.command.ts
import { ICommand } from '@nestjs/cqrs';

import { UpdateBeneficiaryShareDto } from '../../dto/requests/update-beneficiary-share.dto';

export class UpdateBeneficiaryShareCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly data: UpdateBeneficiaryShareDto,
    public readonly correlationId?: string,
  ) {}
}
