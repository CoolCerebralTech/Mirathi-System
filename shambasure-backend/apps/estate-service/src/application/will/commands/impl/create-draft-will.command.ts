import { BaseCommand } from '../../../common/base/base.command';
import { CreateDraftWillDto } from '../dtos/create-draft-will.dto';

/**
 * Command to initiate the drafting of a new Will.
 *
 * PURPOSE:
 * Serves as the intent to start the testamentary process.
 * Tracks the 'who', 'when', and 'what' of the request.
 */
export class CreateDraftWillCommand extends BaseCommand {
  public readonly data: CreateDraftWillDto;

  constructor(props: { userId: string; data: CreateDraftWillDto; correlationId?: string }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.data = props.data;
  }
}
