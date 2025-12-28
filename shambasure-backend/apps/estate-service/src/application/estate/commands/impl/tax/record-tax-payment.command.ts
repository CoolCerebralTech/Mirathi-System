import { BaseCommand } from '../../../../common/base/base.command';
import { RecordTaxPaymentDto } from '../../dtos/tax/record-tax-payment.dto';

export class RecordTaxPaymentCommand extends BaseCommand {
  constructor(
    public readonly dto: RecordTaxPaymentDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
