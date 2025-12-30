import { IQuery } from '@nestjs/cqrs';

import { GetAssessmentDto } from '../dtos/get-assessment.dto';

export class GetStrategyRoadmapQuery implements IQuery {
  constructor(public readonly dto: GetAssessmentDto) {}
}
