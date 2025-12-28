import { BaseCommand } from '../../../../common/base/base.command';
import { UpdateAssetValueDto } from '../../dtos/assets/update-asset-value.dto';

export class UpdateAssetValueCommand extends BaseCommand {
  constructor(
    public readonly dto: UpdateAssetValueDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
