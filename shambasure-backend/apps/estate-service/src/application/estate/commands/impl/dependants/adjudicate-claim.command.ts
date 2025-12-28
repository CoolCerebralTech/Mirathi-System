import { BaseCommand } from '../../../../common/base/base.command';
import {
  RejectDependantClaimDto,
  SettleDependantClaimDto,
  VerifyDependantClaimDto,
} from '../../dtos/dependants/adjudicate-claim.dto';

export class VerifyDependantClaimCommand extends BaseCommand {
  constructor(
    public readonly dto: VerifyDependantClaimDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class RejectDependantClaimCommand extends BaseCommand {
  constructor(
    public readonly dto: RejectDependantClaimDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class SettleDependantClaimCommand extends BaseCommand {
  constructor(
    public readonly dto: SettleDependantClaimDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
