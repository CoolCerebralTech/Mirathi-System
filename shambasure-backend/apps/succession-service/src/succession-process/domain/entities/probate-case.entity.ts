import { AggregateRoot } from '@nestjs/cqrs';
import { GrantType } from '@prisma/client'; // Status enum reused or create new
import { ProbateCaseFiledEvent } from '../events/probate-case-filed.event';
import { ProbateStatusChangedEvent } from '../events/probate-status-changed.event';
import { GazetteNoticePublishedEvent } from '../events/gazette-notice-published.event';
import { GrantApplicationType } from '../value-objects/grant-application-type.vo';
import { KenyanCourtJurisdiction } from '../value-objects/kenyan-court-jurisdiction.vo';
import { ProbateCaseNumber } from '../value-objects/probate-case-number.vo';
import { GazetteNotice } from '../value-objects/gazette-notice.vo';

// We define a specific status enum for the domain logic if Schema's DistributionStatus is too broad
export type CaseStatus =
  | 'DRAFT_FILING'
  | 'FILED'
  | 'GAZETTED'
  | 'OBJECTION_PERIOD'
  | 'HEARING_SCHEDULED'
  | 'GRANT_ISSUED'
  | 'CONFIRMED'
  | 'CLOSED';

export class ProbateCase extends AggregateRoot {
  private id: string;
  private estateId: string; // Links to Estate Aggregate in Planning

  // Court Info
  private caseNumber: ProbateCaseNumber | null;
  private court: KenyanCourtJurisdiction;
  private applicationType: GrantApplicationType;

  // Workflow
  private status: CaseStatus;
  private gazetteNotice: GazetteNotice | null;
  private filingDate: Date | null;

  // Linked Entities (IDs)
  private grantId: string | null;
  private inventoryId: string | null;

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    applicationType: GrantApplicationType,
    court: KenyanCourtJurisdiction,
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.applicationType = applicationType;
    this.court = court;

    this.caseNumber = null;
    this.status = 'DRAFT_FILING';
    this.gazetteNotice = null;
    this.filingDate = null;
    this.grantId = null;
    this.inventoryId = null;

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY
  // --------------------------------------------------------------------------

  static create(
    id: string,
    estateId: string,
    type: GrantType,
    courtDetails: { level: any; station: string; county: string },
  ): ProbateCase {
    const appType = new GrantApplicationType(type);
    const court = new KenyanCourtJurisdiction(
      courtDetails.level,
      courtDetails.station,
      courtDetails.county,
    );

    return new ProbateCase(id, estateId, appType, court);
  }

  static reconstitute(props: any): ProbateCase {
    const appType = new GrantApplicationType(props.grantType);
    const court = new KenyanCourtJurisdiction(
      props.courtLevel,
      props.courtStation,
      props.courtCounty,
    );

    const prob = new ProbateCase(props.id, props.estateId, appType, court);

    if (props.caseNumber) prob.caseNumber = new ProbateCaseNumber(props.caseNumber);
    prob.status = props.status;
    prob.filingDate = props.filingDate ? new Date(props.filingDate) : null;
    prob.grantId = props.grantId;

    // Reconstruct Gazette Notice VO
    if (props.gazetteNoticeNumber) {
      prob.gazetteNotice = new GazetteNotice(
        props.gazetteNoticeNumber,
        new Date(props.gazettePubDate),
      );
    }

    prob.createdAt = new Date(props.createdAt);
    prob.updatedAt = new Date(props.updatedAt);
    return prob;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Officially records the case in the court system (e.g. E-Filing complete).
   */
  fileCase(caseNumberString: string): void {
    if (this.status !== 'DRAFT_FILING') throw new Error('Case is already filed.');

    this.caseNumber = new ProbateCaseNumber(caseNumberString);
    this.filingDate = new Date();
    this.changeStatus('FILED');

    this.apply(
      new ProbateCaseFiledEvent(
        this.id,
        this.estateId,
        this.caseNumber.getValue(),
        this.court.getStation(),
        this.filingDate,
      ),
    );
  }

  /**
   * Records publication in the Kenya Gazette.
   * This starts the 30-day objection timer.
   */
  publishGazetteNotice(noticeNumber: string, pubDate: Date): void {
    if (this.status !== 'FILED') throw new Error('Case must be filed before gazettement.');

    this.gazetteNotice = new GazetteNotice(noticeNumber, pubDate);
    this.changeStatus('OBJECTION_PERIOD'); // or GAZETTED

    this.apply(
      new GazetteNoticePublishedEvent(
        this.id,
        noticeNumber,
        pubDate,
        this.gazetteNotice.getObjectionExpiryDate(),
      ),
    );
  }

  /**
   * Checks if we can proceed to extract the Grant.
   */
  canIssueGrant(): boolean {
    if (!this.gazetteNotice) return false;
    // Must be past 30 days
    if (!this.gazetteNotice.hasMatured()) return false;
    // Must not be contested (Logic usually handled by Service querying Dispute Repo)
    return true;
  }

  linkGrant(grantId: string): void {
    this.grantId = grantId;
    this.changeStatus('GRANT_ISSUED');
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private changeStatus(newStatus: CaseStatus): void {
    const old = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();
    this.apply(new ProbateStatusChangedEvent(this.id, old, newStatus));
  }

  // Getters
  getId() {
    return this.id;
  }
  getEstateId() {
    return this.estateId;
  }
  getCaseNumber() {
    return this.caseNumber?.getValue();
  }
  getStatus() {
    return this.status;
  }
  getApplicationType() {
    return this.applicationType;
  }
  getCourt() {
    return this.court;
  }
}
