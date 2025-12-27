import { BaseCommand } from '../../../../application/common/base/base.command';
import { RecordWitnessSignatureDto } from '../dtos/record-witness-signature.dto';

/**
 * Command to record a signature for an existing witness.
 *
 * DOMAIN LOGIC:
 * - Updates witness status from PENDING to SIGNED.
 * - Captures the timestamp and method of signing.
 */
export class RecordWitnessSignatureCommand extends BaseCommand {
  public readonly willId: string;
  public readonly data: RecordWitnessSignatureDto;

  constructor(props: {
    userId: string;
    willId: string;
    data: RecordWitnessSignatureDto;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.data = props.data;
  }
}
