import { BaseCommand } from '../../../../common/base/base.command';
import { ExecuteS45WaterfallDto } from '../../dtos/debt/execute-s45-waterfall.dto';

export class ExecuteS45WaterfallCommand extends BaseCommand {
  constructor(
    public readonly dto: ExecuteS45WaterfallDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
