import { ICommand } from '@nestjs/cqrs';

import { CompleteAssessmentDto } from '../dtos/complete-assessment.dto';

export class CompleteAssessmentCommand implements ICommand {
  constructor(public readonly dto: CompleteAssessmentDto) {}
}
