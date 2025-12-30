import { BaseCommand } from '../../../../common/base/base.command';
import {
  AddDependantEvidenceDto,
  VerifyDependantEvidenceDto,
} from '../../dtos/dependants/manage-evidence.dto';

export class AddDependantEvidenceCommand extends BaseCommand {
  constructor(
    public readonly dto: AddDependantEvidenceDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class VerifyDependantEvidenceCommand extends BaseCommand {
  constructor(
    public readonly dto: VerifyDependantEvidenceDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
