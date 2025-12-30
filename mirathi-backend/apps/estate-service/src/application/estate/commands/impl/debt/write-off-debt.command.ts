import { BaseCommand } from '../../../../common/base/base.command';
import { WriteOffDebtDto } from '../../dtos/debt/write-off-debt.dto';

export class WriteOffDebtCommand extends BaseCommand {
  constructor(
    public readonly dto: WriteOffDebtDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
