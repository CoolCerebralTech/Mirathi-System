// commands/beneficiary/create-beneficiary-assignment.command.ts
import { ICommand } from '@nestjs/cqrs';

import { CreateBeneficiaryAssignmentDto } from '../../dto/requests/create-beneficiary-assignment.dto';

export class CreateBeneficiaryAssignmentCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly assetId: string,
    public readonly data: CreateBeneficiaryAssignmentDto,
    public readonly correlationId?: string,
  ) {}
}
