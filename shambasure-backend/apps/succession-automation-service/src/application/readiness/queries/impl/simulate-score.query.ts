import { IQuery } from '@nestjs/cqrs';

import { SimulateScoreDto } from '../dtos/simulate-score.dto';

export class SimulateScoreQuery implements IQuery {
  constructor(public readonly dto: SimulateScoreDto) {}
}
