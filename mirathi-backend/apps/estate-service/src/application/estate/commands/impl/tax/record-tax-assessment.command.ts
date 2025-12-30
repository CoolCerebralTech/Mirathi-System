import { BaseCommand } from '../../../../common/base/base.command';
import { RecordTaxAssessmentDto } from '../../dtos/tax/record-tax-assessment.dto';

export class RecordTaxAssessmentCommand extends BaseCommand {
  constructor(
    public readonly dto: RecordTaxAssessmentDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
