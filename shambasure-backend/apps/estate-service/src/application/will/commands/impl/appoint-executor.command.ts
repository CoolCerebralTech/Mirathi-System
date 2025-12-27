import { BaseCommand } from '../../../../application/common/base/base.command';
import { AppointExecutorDto } from '../dtos/appoint-executor.dto';

/**
 * Command to nominate an executor in the draft will.
 *
 * DOMAIN LOGIC:
 * - Checks for duplicate Primary executors.
 * - Validates basic eligibility (handled by Entity).
 */
export class AppointExecutorCommand extends BaseCommand {
  public readonly willId: string;
  public readonly data: AppointExecutorDto;

  constructor(props: {
    userId: string;
    willId: string;
    data: AppointExecutorDto;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.data = props.data;
  }
}
