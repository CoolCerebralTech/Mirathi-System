import { BaseCommand } from '../../../../common/base/base.command';
import { RecordGiftInterVivosDto } from '../../dtos/gifts/record-gift-inter-vivos.dto';

export class RecordGiftInterVivosCommand extends BaseCommand {
  constructor(
    public readonly dto: RecordGiftInterVivosDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
