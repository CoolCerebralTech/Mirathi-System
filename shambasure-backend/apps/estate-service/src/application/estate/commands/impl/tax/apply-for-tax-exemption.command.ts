import { BaseCommand } from '../../../../common/base/base.command';
import { ApplyForTaxExemptionDto } from '../../dtos/tax/apply-for-tax-exemption.dto';

export class ApplyForTaxExemptionCommand extends BaseCommand {
  constructor(
    public readonly dto: ApplyForTaxExemptionDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
