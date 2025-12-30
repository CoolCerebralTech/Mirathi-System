import { BaseCommand } from '../../../../common/base/base.command';
import { ContestGiftDto, ResolveGiftDisputeDto } from '../../dtos/gifts/manage-gift-dispute.dto';

export class ContestGiftCommand extends BaseCommand {
  constructor(
    public readonly dto: ContestGiftDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class ResolveGiftDisputeCommand extends BaseCommand {
  constructor(
    public readonly dto: ResolveGiftDisputeDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
