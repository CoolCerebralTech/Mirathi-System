import { BaseCommand } from '../../../common/base/base.command';
import { ExecuteWillDto } from '../dtos/execute-will.dto';

/**
 * Command to transition a Will from DRAFT to WITNESSED/EXECUTED.
 *
 * CRITICAL BUSINESS EVENT:
 * This freezes the draft content and legally binds the testator to this version.
 */
export class ExecuteWillCommand extends BaseCommand {
  public readonly willId: string;
  public readonly data: ExecuteWillDto;

  constructor(props: {
    userId: string;
    willId: string;
    data: ExecuteWillDto;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.data = props.data;
  }
}
