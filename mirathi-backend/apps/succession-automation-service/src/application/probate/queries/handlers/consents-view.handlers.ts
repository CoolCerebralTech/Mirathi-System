import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ConsentStatus } from 'apps/succession-automation-service/src/domain/entities/family-consent.entity';

import type { IProbateApplicationRepository } from '../../../../domain/repositories/i-probate-application.repository';
import { PROBATE_APPLICATION_REPOSITORY } from '../../../../domain/repositories/i-probate-application.repository';
import { Result } from '../../../common/result';
import { GetConsentStatusQuery } from '../impl/probate.queries';
import { ConsentItemVm, ConsentMatrixVm } from '../view-models/consent-matrix.vm';

@QueryHandler(GetConsentStatusQuery)
export class GetConsentStatusHandler implements IQueryHandler<GetConsentStatusQuery> {
  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(query: GetConsentStatusQuery): Promise<Result<ConsentMatrixVm>> {
    const { dto } = query;
    const application = await this.repository.findById(dto.applicationId);

    if (!application) return Result.fail('Application not found');

    const consents = application.consents;

    const items: ConsentItemVm[] = consents
      .map((c) => ({
        id: c.id.toString(),
        familyMemberId: c.familyMemberId,
        fullName: c.fullName,
        role: c.role,
        relationship: c.relationshipToDeceased,

        status: c.status,
        isRequired: c.isRequired(),

        hasPhone: !!c.phoneNumber,
        hasEmail: !!c.email,

        requestSentAt: c.requestSentAt,
        respondedAt: c.respondedAt,
        expiresAt: c.requestExpiresAt,

        method: c.method,
        declineReason: c.declineReason,

        canSendRequest: c.canSendRequest(),
        canMarkNotRequired: c.isPending(),
      }))
      .sort((a, b) => {
        // Sort by Priority (Needs Attention first)
        const priorityA =
          a.status === ConsentStatus.DECLINED ? 3 : a.status === ConsentStatus.PENDING ? 2 : 1;
        const priorityB =
          b.status === ConsentStatus.DECLINED ? 3 : b.status === ConsentStatus.PENDING ? 2 : 1;
        return priorityB - priorityA;
      });

    const matrix: ConsentMatrixVm = {
      applicationId: application.id.toString(),
      totalRequired: application.getRequiredConsents().length,
      received: application.getGrantedConsents().length,
      pending: application.getPendingConsents().length,
      declined: application.getDeclinedConsents().length,
      isComplete: application.areAllConsentsReceived(),
      items,
    };

    return Result.ok(matrix);
  }
}
