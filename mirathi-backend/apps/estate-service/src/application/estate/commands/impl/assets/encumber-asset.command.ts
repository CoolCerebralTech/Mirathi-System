import { BaseCommand } from '../../../../common/base/base.command';
import { EncumberAssetDto } from '../../dtos/assets/encumber-asset.dto';

export class EncumberAssetCommand extends BaseCommand {
  constructor(
    public readonly dto: EncumberAssetDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
