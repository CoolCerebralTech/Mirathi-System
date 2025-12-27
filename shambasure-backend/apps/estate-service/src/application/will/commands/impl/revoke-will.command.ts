import { BaseCommand } from '../../../../application/common/base/base.command';
import { RevokeWillDto } from '../dtos/revoke-will.dto';

/**
 * Command to mark a Will as REVOKED.
 *
 * SIDE EFFECTS:
 * - Marks the aggregate as revoked.
 * - Sets the revocation date to NOW.
 * - Prevents further edits or execution of this Will.
 */
export class RevokeWillCommand extends BaseCommand {
  public readonly willId: string;
  public readonly data: RevokeWillDto;

  constructor(props: {
    userId: string;
    willId: string;
    data: RevokeWillDto;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.data = props.data;
  }
}
