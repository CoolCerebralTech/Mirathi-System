import { ICommand } from '@nestjs/cqrs';

import {
  FileApplicationDto,
  PayFilingFeeDto,
  RecordCourtResponseDto,
  RecordGazettePublicationDto,
  RecordGrantIssuanceDto,
} from '../dtos/filing-interaction.dtos';

export class PayFilingFeeCommand implements ICommand {
  constructor(public readonly dto: PayFilingFeeDto) {}
}

export class FileApplicationCommand implements ICommand {
  constructor(public readonly dto: FileApplicationDto) {}
}

export class RecordCourtResponseCommand implements ICommand {
  constructor(public readonly dto: RecordCourtResponseDto) {}
}

export class RecordGazettePublicationCommand implements ICommand {
  constructor(public readonly dto: RecordGazettePublicationDto) {}
}

export class RecordGrantIssuanceCommand implements ICommand {
  constructor(public readonly dto: RecordGrantIssuanceDto) {}
}
