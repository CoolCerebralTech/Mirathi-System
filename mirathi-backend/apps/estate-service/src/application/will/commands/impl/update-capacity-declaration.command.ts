import { BaseCommand } from '../../../common/base/base.command';
import { UpdateCapacityDeclarationDto } from '../dtos/update-capacity-declaration.dto';

/**
 * Command to update the mental capacity record of the testator.
 *
 * DOMAIN LOGIC:
 * - Can only be updated on DRAFT wills.
 * - Executed wills have their capacity locked in time.
 */
export class UpdateCapacityDeclarationCommand extends BaseCommand {
  public readonly willId: string;
  public readonly data: UpdateCapacityDeclarationDto;

  constructor(props: {
    userId: string;
    willId: string;
    data: UpdateCapacityDeclarationDto;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.data = props.data;
  }
}
