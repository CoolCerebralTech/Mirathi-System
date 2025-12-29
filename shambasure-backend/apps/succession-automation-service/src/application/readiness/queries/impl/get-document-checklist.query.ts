import { IQuery } from '@nestjs/cqrs';

import { GetAssessmentDto } from '../dtos/get-assessment.dto';

export class GetDocumentChecklistQuery implements IQuery {
  constructor(public readonly dto: GetAssessmentDto) {}
}
