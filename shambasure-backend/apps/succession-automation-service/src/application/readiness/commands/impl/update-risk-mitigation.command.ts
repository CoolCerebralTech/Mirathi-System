import { ICommand } from '@nestjs/cqrs';

import { UpdateRiskMitigationDto } from '../dtos/update-risk-mitigation.dto';

export class UpdateRiskMitigationCommand implements ICommand {
  constructor(
    public readonly dto: UpdateRiskMitigationDto,
    public readonly userId: string,
  ) {}
}
