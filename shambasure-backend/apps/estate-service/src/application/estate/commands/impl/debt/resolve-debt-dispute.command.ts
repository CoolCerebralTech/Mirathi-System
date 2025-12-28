import { BaseCommand } from '../../../../common/base/base.command';
import { ResolveDebtDisputeDto } from '../../dtos/debt/resolve-debt-dispute.dto';

export class ResolveDebtDisputeCommand extends BaseCommand {
  constructor(
    public readonly dto: ResolveDebtDisputeDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
