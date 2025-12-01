// commands/beneficiary/add-beneficiary-condition.command.ts
import { ICommand } from '@nestjs/cqrs';

import { AddBeneficiaryConditionDto } from '../../dto/requests/add-beneficiary-condition.dto';

export class AddBeneficiaryConditionCommand implements ICommand {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly data: AddBeneficiaryConditionDto,
    public readonly correlationId?: string,
  ) {}
}
