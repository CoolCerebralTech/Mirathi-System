import { ICommand } from '@nestjs/cqrs';

import { AcknowledgeWarningDto } from '../dtos/acknowledge-warning.dto';
import { DisputeRiskDto } from '../dtos/dispute-risk.dto';
import { OverrideStrategyDto } from '../dtos/override-strategy.dto';

export class AcknowledgeWarningCommand implements ICommand {
  constructor(
    public readonly dto: AcknowledgeWarningDto,
    public readonly userId: string,
  ) {}
}

export class DisputeRiskCommand implements ICommand {
  constructor(
    public readonly dto: DisputeRiskDto,
    public readonly userId: string,
  ) {}
}

export class OverrideStrategyCommand implements ICommand {
  constructor(
    public readonly dto: OverrideStrategyDto,
    public readonly userId: string,
  ) {}
}
