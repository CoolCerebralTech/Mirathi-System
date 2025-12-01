// add-will-witness.command.ts
import { ICommand } from '@nestjs/cqrs';

import { AddWitnessDto } from '../../dto/requests/add-witness.dto';

export class AddWillWitnessCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: AddWitnessDto,
  ) {}
}
