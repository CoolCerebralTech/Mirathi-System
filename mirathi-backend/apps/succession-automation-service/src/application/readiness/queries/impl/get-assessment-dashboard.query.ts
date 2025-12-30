import { IQuery } from '@nestjs/cqrs';

import { GetAssessmentDto } from '../dtos/get-assessment.dto';

export class GetAssessmentDashboardQuery implements IQuery {
  constructor(public readonly dto: GetAssessmentDto) {}
}
