import { BaseCommand } from '../../../../common/base/base.command';
import { CloseEstateDto } from '../../dtos/lifecycle/close-estate.dto';
import { CreateEstateDto } from '../../dtos/lifecycle/create-estate.dto';
import { FreezeEstateDto } from '../../dtos/lifecycle/freeze-estate.dto';
import { UnfreezeEstateDto } from '../../dtos/lifecycle/unfreeze-estate.dto';

export class CreateEstateCommand extends BaseCommand {
  constructor(
    public readonly dto: CreateEstateDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class FreezeEstateCommand extends BaseCommand {
  constructor(
    public readonly dto: FreezeEstateDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class UnfreezeEstateCommand extends BaseCommand {
  constructor(
    public readonly dto: UnfreezeEstateDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}

export class CloseEstateCommand extends BaseCommand {
  constructor(
    public readonly dto: CloseEstateDto,
    props: { userId: string; correlationId?: string },
  ) {
    super(props);
  }
}
