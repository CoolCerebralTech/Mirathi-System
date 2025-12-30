import { BaseCommand } from '../../../common/base/base.command';
import { RecordDisinheritanceDto } from '../dtos/record-disinheritance.dto';

/**
 * Command to add a Disinheritance Record to the Will.
 *
 * DOMAIN LOGIC:
 * - Can only happen in DRAFT state.
 * - Checks for contradictions (e.g., You cannot disinherit someone who
 *   already has a Bequest in the same will).
 */
export class RecordDisinheritanceCommand extends BaseCommand {
  public readonly willId: string;
  public readonly data: RecordDisinheritanceDto;

  constructor(props: {
    userId: string;
    willId: string;
    data: RecordDisinheritanceDto;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.data = props.data;
  }
}
