import { BaseCommand } from '../../../../common/base/base.command';
import { DisputeDebtDto } from '../../dtos/debt/dispute-debt.dto';

export class DisputeDebtCommand extends BaseCommand {
  constructor(
    public readonly dto: DisputeDebtDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
