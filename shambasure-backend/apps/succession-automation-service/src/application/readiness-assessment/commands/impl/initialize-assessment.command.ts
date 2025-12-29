import { ICommand } from '@nestjs/cqrs';

import { InitializeAssessmentDto } from '../dtos/initialize-assessment.dto';

export class InitializeAssessmentCommand implements ICommand {
  constructor(public readonly dto: InitializeAssessmentDto) {}
}
