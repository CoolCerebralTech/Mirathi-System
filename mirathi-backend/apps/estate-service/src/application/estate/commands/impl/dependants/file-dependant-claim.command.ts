import { BaseCommand } from '../../../../common/base/base.command';
import { FileDependantClaimDto } from '../../dtos/dependants/file-dependant-claim.dto';

export class FileDependantClaimCommand extends BaseCommand {
  constructor(
    public readonly dto: FileDependantClaimDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
