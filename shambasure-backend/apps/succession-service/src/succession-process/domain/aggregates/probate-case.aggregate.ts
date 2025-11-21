import { AggregateRoot } from '@nestjs/cqrs';
import { ProbateCase } from '../entities/probate-case.entity';
import { SuccessionCertificate } from '../entities/succession-certificate.entity';
import { CourtHearing } from '../entities/court-hearing.entity';
import { Dispute } from '../entities/dispute.entity';
import { HearingType } from '../../../common/types/kenyan-law.types';
import { GrantType } from '@prisma/client';

export class ProbateCaseAggregate extends AggregateRoot {
  private probateCase: ProbateCase;
  private certificate: SuccessionCertificate | null;

  // Collections
  private hearings: Map<string, CourtHearing> = new Map();
  private disputes: Map<string, Dispute> = new Map();

  private constructor(probateCase: ProbateCase) {
    super();
    this.probateCase = probateCase;
    this.certificate = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY & RECONSTITUTION
  // --------------------------------------------------------------------------

  static create(probateCase: ProbateCase): ProbateCaseAggregate {
    return new ProbateCaseAggregate(probateCase);
  }

  static reconstitute(
    probateCase: ProbateCase,
    certificate: SuccessionCertificate | null,
    hearings: CourtHearing[],
    disputes: Dispute[],
  ): ProbateCaseAggregate {
    const agg = new ProbateCaseAggregate(probateCase);
    agg.certificate = certificate;
    hearings.forEach((h) => agg.hearings.set(h.getId(), h));
    disputes.forEach((d) => agg.disputes.set(d.getId(), d));
    return agg;
  }

  // --------------------------------------------------------------------------
  // COURT WORKFLOW LOGIC
  // --------------------------------------------------------------------------

  scheduleHearing(date: Date, type: HearingType, virtualLink?: string): string {
    if (this.probateCase.getStatus() === 'CLOSED') {
      throw new Error('Cannot schedule hearings for a closed case.');
    }

    // Use Entity Factory
    // Note: Assuming ID generation happens here or in factory.
    // For Aggregates, we usually pass IDs. Let's assume UUID gen here.
    const id = crypto.randomUUID();
    const hearing = CourtHearing.schedule(id, this.probateCase.getId(), date, type, virtualLink);

    this.hearings.set(id, hearing);
    return id;
  }

  concludeHearing(hearingId: string, outcome: string, presidedBy: string): void {
    const hearing = this.hearings.get(hearingId);
    if (!hearing) throw new Error('Hearing not found.');

    hearing.complete(outcome, presidedBy);
  }

  fileDispute(dispute: Dispute): void {
    this.disputes.set(dispute.getId(), dispute);
    // A dispute might block the case status
    // Logic to update ProbateCase status could go here if needed
  }

  /**
   * Issues the Grant (Probate/Letters).
   * Checks: No active disputes, Gazette period matured (via Service/Policy usually, but Aggregate enforces state).
   */
  issueGrant(grantId: string, applicantId: string, type: GrantType, date: Date): void {
    // 1. Check Disputes
    const hasActiveDispute = Array.from(this.disputes.values()).some((d) =>
      ['FILED', 'MEDIATION', 'COURT_PROCEEDING'].includes(d.getStatus()),
    );

    if (hasActiveDispute) {
      throw new Error('Cannot issue Grant while there are active disputes (Caveats).');
    }

    // 2. Check Case Readiness
    // The ProbateCase entity tracks Gazette logic
    if (!this.probateCase.canIssueGrant()) {
      throw new Error('Case is not ready for Grant Issue (e.g. Gazette notice period pending).');
    }

    if (this.certificate) {
      throw new Error('Grant has already been issued.');
    }

    this.certificate = SuccessionCertificate.create(
      grantId,
      this.probateCase.getEstateId(),
      applicantId,
      type,
      date,
    );

    this.probateCase.linkGrant(grantId);
  }

  confirmGrant(confirmationDate: Date): void {
    if (!this.certificate) {
      throw new Error('No Grant exists to confirm.');
    }
    // Delegate to Entity Logic (Section 71 checks)
    this.certificate.confirmGrant(confirmationDate);
  }

  // --------------------------------------------------------------------------
  // ACCESSORS
  // --------------------------------------------------------------------------

  getCase(): ProbateCase {
    return this.probateCase;
  }
  getCertificate(): SuccessionCertificate | null {
    return this.certificate;
  }
  getHearings(): CourtHearing[] {
    return Array.from(this.hearings.values());
  }
  getDisputes(): Dispute[] {
    return Array.from(this.disputes.values());
  }
}
