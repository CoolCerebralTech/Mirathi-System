import { BaseCommand } from '../../../../common/base/base.command';
import { CancelLiquidationDto } from '../../dtos/liquidation/cancel-liquidation.dto';
import { InitiateLiquidationDto } from '../../dtos/liquidation/initiate-liquidation.dto';
import {
  ApproveLiquidationDto,
  SubmitLiquidationForApprovalDto,
} from '../../dtos/liquidation/manage-liquidation-approval.dto';
import { ReceiveLiquidationProceedsDto } from '../../dtos/liquidation/receive-liquidation-proceeds.dto';
import { RecordLiquidationSaleDto } from '../../dtos/liquidation/record-liquidation-sale.dto';

export class InitiateLiquidationCommand extends BaseCommand {
  constructor(
    public readonly dto: InitiateLiquidationDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class SubmitLiquidationForApprovalCommand extends BaseCommand {
  constructor(
    public readonly dto: SubmitLiquidationForApprovalDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class ApproveLiquidationCommand extends BaseCommand {
  constructor(
    public readonly dto: ApproveLiquidationDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class RecordLiquidationSaleCommand extends BaseCommand {
  constructor(
    public readonly dto: RecordLiquidationSaleDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class ReceiveLiquidationProceedsCommand extends BaseCommand {
  constructor(
    public readonly dto: ReceiveLiquidationProceedsDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class CancelLiquidationCommand extends BaseCommand {
  constructor(
    public readonly dto: CancelLiquidationDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
