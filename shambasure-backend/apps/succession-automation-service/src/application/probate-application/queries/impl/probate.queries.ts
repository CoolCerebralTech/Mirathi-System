import { IQuery } from '@nestjs/cqrs';

import { GetConsentStatusDto } from '../dtos/consents-view.dtos';
import { GetApplicationDashboardDto, GetUserApplicationsDto } from '../dtos/dashboard.dtos';
import { CalculateFilingFeesDto, ValidateFilingReadinessDto } from '../dtos/filing-readiness.dtos';
import { GetFormPreviewDto, GetGeneratedFormsDto } from '../dtos/forms-view.dtos';

// --- Dashboard ---
export class GetApplicationDashboardQuery implements IQuery {
  constructor(public readonly dto: GetApplicationDashboardDto) {}
}

export class GetUserApplicationsQuery implements IQuery {
  constructor(public readonly dto: GetUserApplicationsDto) {}
}

// --- Forms ---
export class GetGeneratedFormsQuery implements IQuery {
  constructor(public readonly dto: GetGeneratedFormsDto) {}
}

export class GetFormPreviewQuery implements IQuery {
  constructor(public readonly dto: GetFormPreviewDto) {}
}

// --- Consents ---
export class GetConsentStatusQuery implements IQuery {
  constructor(public readonly dto: GetConsentStatusDto) {}
}

// --- Filing ---
export class ValidateFilingReadinessQuery implements IQuery {
  constructor(public readonly dto: ValidateFilingReadinessDto) {}
}

export class CalculateFilingFeesQuery implements IQuery {
  constructor(public readonly dto: CalculateFilingFeesDto) {}
}
