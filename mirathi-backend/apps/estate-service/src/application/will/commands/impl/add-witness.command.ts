import { BaseCommand } from '../../../common/base/base.command';
import { AddWitnessDto } from '../dtos/add-witness.dto';

/**
 * Command to add a witness to the draft.
 *
 * DOMAIN LOGIC:
 * - Can only be done on DRAFT wills.
 * - Witness must pass basic eligibility (S.11).
 */
export class AddWitnessCommand extends BaseCommand {
  public readonly willId: string;
  public readonly data: AddWitnessDto;

  constructor(props: {
    userId: string;
    willId: string;
    data: AddWitnessDto;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.data = props.data;
  }
}
