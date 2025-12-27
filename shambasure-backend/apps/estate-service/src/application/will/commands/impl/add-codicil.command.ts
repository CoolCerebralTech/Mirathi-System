import { BaseCommand } from '../../../../application/common/base/base.command';
import { AddCodicilDto } from '../dtos/add-codicil.dto';

/**
 * Command to attach a Codicil to an existing Executed Will.
 *
 * DOMAIN LOGIC:
 * - Can only be added to wills in WITNESSED or ACTIVE state.
 * - Codicil must be fully executed (cannot add a "Draft" codicil based on current Entity rules).
 */
export class AddCodicilCommand extends BaseCommand {
  public readonly willId: string;
  public readonly data: AddCodicilDto;

  constructor(props: {
    userId: string;
    willId: string;
    data: AddCodicilDto;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.data = props.data;
  }
}
