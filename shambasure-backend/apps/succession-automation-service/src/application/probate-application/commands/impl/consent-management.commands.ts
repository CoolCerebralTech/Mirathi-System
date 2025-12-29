import { ICommand } from '@nestjs/cqrs';

import {
  MarkConsentNotRequiredDto,
  RecordConsentDeclineDto,
  RecordConsentGrantDto,
  RequestFamilyConsentDto,
} from '../dtos/consent-management.dtos';

export class RequestFamilyConsentCommand implements ICommand {
  constructor(public readonly dto: RequestFamilyConsentDto) {}
}

export class RecordConsentGrantCommand implements ICommand {
  constructor(public readonly dto: RecordConsentGrantDto) {}
}

export class RecordConsentDeclineCommand implements ICommand {
  constructor(public readonly dto: RecordConsentDeclineDto) {}
}

export class MarkConsentNotRequiredCommand implements ICommand {
  constructor(public readonly dto: MarkConsentNotRequiredDto) {}
}
