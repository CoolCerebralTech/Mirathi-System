import { BaseCommand } from '../../../../common/base/base.command';
import { AddDebtDto } from '../../dtos/debt/add-debt.dto';

export class AddDebtCommand extends BaseCommand {
  constructor(
    public readonly dto: AddDebtDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
