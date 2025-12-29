import { ICommand } from '@nestjs/cqrs';

import { ForceRecalculationDto } from '../dtos/force-recalculation.dto';

export class ForceRecalculationCommand implements ICommand {
  constructor(public readonly dto: ForceRecalculationDto) {}
}
