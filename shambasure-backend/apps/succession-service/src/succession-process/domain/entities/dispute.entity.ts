import { AggregateRoot } from '@nestjs/cqrs';
import { DisputeStatus, DisputeType } from '@prisma/client';
import { DisputeFiledEvent } from '../events/dispute-filed.event';
import { DisputeResolvedEvent } from '../events/dispute-resolved.event';
import { LegalGrounds } from '../value-objects/legal-grounds.vo';

export class Dispute extends AggregateRoot {
  private id: string;
  private willId: string; // The subject of the dispute
  private disputantId: string; // The person objecting (Caveator)

  // Legal Details
  private type: DisputeType;
  private grounds: LegalGrounds;
  private caseNumber: string | null; // If it becomes a formal suit (e.g., "Obj. No 1 of 2025")

  // Process
  private status: DisputeStatus;
  private resolution: string | null;
  private resolvedAt: Date | null;

  // Evidence
  private evidenceUrls: string[];

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    willId: string,
    disputantId: string,
    type: DisputeType,
    grounds: LegalGrounds,
  ) {
    super();
    this.id = id;
    this.willId = willId;
    this.disputantId = disputantId;
    this.type = type;
    this.grounds = grounds;

    this.status = 'FILED';
    this.caseNumber = null;
    this.resolution = null;
    this.resolvedAt = null;
    this.evidenceUrls = [];

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY
  // --------------------------------------------------------------------------

  static create(
    id: string,
    willId: string,
    disputantId: string,
    type: DisputeType,
    description: string,
    evidenceRef: string[] = [],
  ): Dispute {
    // Validate Grounds using Value Object logic
    const grounds = new LegalGrounds(type, description, evidenceRef);

    const dispute = new Dispute(id, willId, disputantId, type, grounds);
    dispute.evidenceUrls = evidenceRef;

    dispute.apply(new DisputeFiledEvent(id, willId, disputantId, type, description));

    return dispute;
  }

  static reconstitute(props: any): Dispute {
    const grounds = new LegalGrounds(props.type, props.description, props.evidenceUrls);

    const dispute = new Dispute(props.id, props.willId, props.disputantId, props.type, grounds);

    dispute.status = props.status;
    dispute.caseNumber = props.caseNumber || null;
    dispute.resolution = props.resolution || null;
    dispute.resolvedAt = props.resolvedAt ? new Date(props.resolvedAt) : null;
    dispute.evidenceUrls = props.evidenceUrls || [];
    dispute.createdAt = new Date(props.createdAt);
    dispute.updatedAt = new Date(props.updatedAt);

    return dispute;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Escalates the dispute to formal Court Proceedings.
   */
  fileInCourt(courtCaseNumber: string): void {
    if (this.status === 'RESOLVED' || this.status === 'DISMISSED') {
      throw new Error('Cannot escalate a closed dispute.');
    }

    this.status = 'COURT_PROCEEDING';
    this.caseNumber = courtCaseNumber;
    this.updatedAt = new Date();
  }

  /**
   * Move to Mediation (Recommended first step in Kenya).
   */
  startMediation(): void {
    if (this.status !== 'FILED' && this.status !== 'UNDER_REVIEW') {
      // Can return to mediation from court? Usually court orders it.
      // Allowing flexible transition for now.
    }
    this.status = 'MEDIATION';
    this.updatedAt = new Date();
  }

  /**
   * Resolve the dispute (Settled or Judged).
   */
  resolve(outcome: string, isDismissed: boolean): void {
    if (this.status === 'RESOLVED' || this.status === 'DISMISSED') {
      return; // Idempotent
    }

    this.status = isDismissed ? 'DISMISSED' : 'RESOLVED';
    this.resolution = outcome;
    this.resolvedAt = new Date();
    this.updatedAt = new Date();

    this.apply(
      new DisputeResolvedEvent(this.id, this.willId, outcome, this.status, this.resolvedAt),
    );
  }

  /**
   * Withdraw the dispute (by the disputant).
   */
  withdraw(reason: string): void {
    this.resolve(`Withdrawn by applicant: ${reason}`, true);
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId() {
    return this.id;
  }
  getWillId() {
    return this.willId;
  }
  getDisputantId() {
    return this.disputantId;
  }
  getStatus() {
    return this.status;
  }
  getGrounds() {
    return this.grounds;
  }
  getResolution() {
    return this.resolution;
  }
}
