import { ICommand } from '@nestjs/cqrs';

import { OverrideStrategyDto } from '../dtos/override-strategy.dto';

export class OverrideStrategyCommand implements ICommand {
  constructor(
    public readonly dto: OverrideStrategyDto,
    public readonly userId: string, // Assuming admin/lawyer ID
  ) {}
}
