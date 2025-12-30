import { BaseCommand } from '../../../../common/base/base.command';
import { AddAssetCoOwnerDto } from '../../dtos/assets/manage-asset-co-ownership.dto';

export class AddAssetCoOwnerCommand extends BaseCommand {
  constructor(
    public readonly dto: AddAssetCoOwnerDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
