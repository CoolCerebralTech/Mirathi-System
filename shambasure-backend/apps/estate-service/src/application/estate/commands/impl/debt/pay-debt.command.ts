import { BaseCommand } from '../../../../common/base/base.command';
import { PayDebtDto } from '../../dtos/debt/pay-debt.dto';

export class PayDebtCommand extends BaseCommand {
  constructor(
    public readonly dto: PayDebtDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
