import { ICommand } from '@nestjs/cqrs';

import { AcknowledgeWarningDto } from '../dtos/acknowledge-warning.dto';
import { DisputeRiskDto } from '../dtos/dispute-risk.dto';
import { UpdateRiskMitigationDto } from '../dtos/update-risk-mitigation.dto';

export class DisputeRiskCommand implements ICommand {
  constructor(
    public readonly dto: DisputeRiskDto,
    public readonly userId: string,
  ) {}
}

export class AcknowledgeWarningCommand implements ICommand {
  constructor(
    public readonly dto: AcknowledgeWarningDto,
    public readonly userId: string,
  ) {}
}

export class UpdateRiskMitigationCommand implements ICommand {
  constructor(
    public readonly dto: UpdateRiskMitigationDto,
    public readonly userId: string,
  ) {}
}
