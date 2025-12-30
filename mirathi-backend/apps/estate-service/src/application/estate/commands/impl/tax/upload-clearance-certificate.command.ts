import { BaseCommand } from '../../../../common/base/base.command';
import { UploadClearanceCertificateDto } from '../../dtos/tax/upload-clearance-certificate.dto';

export class UploadClearanceCertificateCommand extends BaseCommand {
  constructor(
    public readonly dto: UploadClearanceCertificateDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
