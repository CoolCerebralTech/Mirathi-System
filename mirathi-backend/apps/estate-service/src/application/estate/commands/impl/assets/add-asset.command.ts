import { BaseCommand } from '../../../../common/base/base.command';
import { AddAssetDto } from '../../dtos/assets/add-asset.dto';

export class AddAssetCommand extends BaseCommand {
  constructor(
    public readonly dto: AddAssetDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
