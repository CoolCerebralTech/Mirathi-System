import { BaseCommand } from '../../../../application/common/base/base.command';
import { AddBeneficiaryDto } from '../dtos/add-beneficiary.dto';

/**
 * Command to add a bequest (gift) to a Will.
 *
 * DOMAIN LOGIC:
 * - Can only be done on DRAFT wills.
 * - Validates that the bequest doesn't contradict disinheritance records.
 */
export class AddBeneficiaryCommand extends BaseCommand {
  public readonly willId: string;
  public readonly data: AddBeneficiaryDto;

  constructor(props: {
    userId: string;
    willId: string;
    data: AddBeneficiaryDto;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.data = props.data;
  }
}
