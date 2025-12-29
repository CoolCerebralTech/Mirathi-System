import { ICommand } from '@nestjs/cqrs';

import { UpdateSuccessionContextDto } from '../dtos/update-succession-context.dto';

export class UpdateContextCommand implements ICommand {
  constructor(public readonly dto: UpdateSuccessionContextDto) {}
}
