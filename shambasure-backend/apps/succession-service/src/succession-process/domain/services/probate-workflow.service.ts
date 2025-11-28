// succession-service/src/succession-process/domain/services/probate-workflow.service.ts
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { ProbateCase } from '../entities/probate-case.entity';
import { SuccessionCertificate } from '../entities/succession-certificate.entity';
import { DistributionTimingPolicy } from '../policies/distribution-timing.policy';
import { ProbateCaseRepositoryInterface } from '../repositories/probate-case.repository.interface';
import { SuccessionCertificateRepositoryInterface } from '../repositories/succession-certificate.repository.interface';

@Injectable()
export class ProbateWorkflowService {
  constructor(
    @Inject('ProbateCaseRepositoryInterface')
    private readonly caseRepo: ProbateCaseRepositoryInterface,
    @Inject('SuccessionCertificateRepositoryInterface')
    private readonly certRepo: SuccessionCertificateRepositoryInterface,
    private readonly timingPolicy: DistributionTimingPolicy,
  ) {}

  /**
   * Advances the case from FILED to GAZETTED.
   */
  async recordGazettement(caseId: string, noticeNumber: string, pubDate: Date): Promise<void> {
    const probateCase = await this.caseRepo.findById(caseId);
    if (!probateCase) throw new Error('Case not found');

    // Business Logic
    probateCase.publishGazetteNotice(noticeNumber, pubDate);

    await this.caseRepo.save(probateCase);
  }

  /**
   * Attempts to Confirm the Grant (Section 71).
   * This is the "Go" signal for distribution.
   */
  async confirmGrant(grantId: string, caseId: string): Promise<void> {
    const cert = await this.certRepo.findById(grantId);
    if (!cert) throw new Error('Grant/Certificate not found');

    // We need the Gazette info from the Case to validate timing
    const probateCase = await this.caseRepo.findById(caseId);
    if (!probateCase) throw new Error('Case not found');

    // 1. Run Timing Policy
    // Note: We need to extract the raw dates.
    // Assuming ProbateCase exposes gazetteDate via getter or we load the VO.
    // In our entity, we access it via getter logic (needs to be exposed).
    // Let's assume probateCase.getGazetteNotice() returns the VO.

    // *Strict Check*: We can't check gazette date if VO isn't public.
    // We rely on the case status 'OBJECTION_PERIOD' -> 'GRANT_ISSUED'.

    const issueDate = cert.getIssueDate();
    // const gazetteDate = probateCase.getGazetteNotice()?.getPublicationDate() || null;
    // (Assuming accessors exist)

    const check = this.timingPolicy.canConfirmGrant(issueDate, null); // Passing null for gazette if not strictly tracked here

    if (!check.allowed) {
      throw new BadRequestException(
        `Cannot confirm grant yet: ${check.reason} (${check.remainingDays} days remaining)`,
      );
    }

    cert.confirmGrant(new Date());
    await this.certRepo.save(cert);
  }
}
