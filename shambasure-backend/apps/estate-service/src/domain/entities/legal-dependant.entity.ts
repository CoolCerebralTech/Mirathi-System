// src/estate-service/src/domain/entities/legal-dependant.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  DependantEvidenceAddedEvent,
  LegalDependantCreatedEvent,
  LegalDependantRejectedEvent,
  LegalDependantVerifiedEvent,
} from '../events/legal-dependant.event';
import { MissingEvidenceException } from '../exceptions/legal-dependant.exception';
import { MoneyVO } from '../value-objects/money.vo';
import { DependantEvidence } from './dependant-evidence.entity';

// S.29 Categories
export enum DependantRelationship {
  SPOUSE = 'SPOUSE', // S.29(a)
  CHILD = 'CHILD', // S.29(a) - Includes adopted/born out of wedlock
  PARENT = 'PARENT', // S.29(b) - Must prove maintenance
  STEP_CHILD = 'STEP_CHILD', // S.29(b) - Must prove maintenance - "Child whom deceased had taken into his family"
  SIBLING = 'SIBLING', // S.29(b) - Must prove maintenance
  OTHER = 'OTHER', // Any other person maintained by deceased
}

export enum DependantStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION', // Claim lodged
  VERIFIED = 'VERIFIED', // Evidence accepted
  REJECTED = 'REJECTED', // Court/Administrator denied claim
  SETTLED = 'SETTLED', // Paid out / Provided for
}

export interface LegalDependantProps {
  estateId: string;
  personId?: string; // Link to User Service (if they have an account)
  fullName: string;
  relationship: DependantRelationship;

  // Demographics (Critical for S.26 "Reasonable Provision")
  dateOfBirth: Date;
  isMinor: boolean; // Calculated or explicit
  isIncapacitated: boolean; // S.26 specific consideration

  // Financials
  monthlyLivingCosts: MoneyVO; // "Maintenance Needs"
  proposedAllocation?: MoneyVO; // What the Estate intends to give

  // Evidence
  evidence: DependantEvidence[];

  status: DependantStatus;
  rejectionReason?: string;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Legal Dependant Entity
 *
 * Represents a person claiming a share of the estate under S.29.
 *
 * LEGAL LOGIC:
 * - If Relationship is SPOUSE or CHILD, dependency is usually assumed (S.29a).
 * - If Relationship is PARENT/SIBLING, actual maintenance *must* be proved (S.29b).
 */
export class LegalDependant extends Entity<LegalDependantProps> {
  private constructor(props: LegalDependantProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
  }

  public static create(
    props: Omit<
      LegalDependantProps,
      'createdAt' | 'updatedAt' | 'version' | 'status' | 'evidence' | 'isMinor'
    >,
    id?: UniqueEntityID,
  ): LegalDependant {
    // Calculate isMinor (Under 18 in Kenya)
    const age = new Date().getFullYear() - props.dateOfBirth.getFullYear();
    const isMinor = age < 18;

    const dependant = new LegalDependant(
      {
        ...props,
        isMinor,
        evidence: [],
        status: DependantStatus.PENDING_VERIFICATION,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );

    dependant.addDomainEvent(
      new LegalDependantCreatedEvent(
        dependant.id.toString(),
        props.estateId,
        props.fullName,
        props.relationship,
        dependant.version,
      ),
    );

    return dependant;
  }

  // Getters
  get fullName(): string {
    return this.props.fullName;
  }
  get relationship(): DependantRelationship {
    return this.props.relationship;
  }
  get status(): DependantStatus {
    return this.props.status;
  }
  get evidence(): DependantEvidence[] {
    return this.props.evidence;
  }

  /**
   * Check if this person falls under S.29(a) - Automatic Dependant
   */
  public isSection29A(): boolean {
    return [DependantRelationship.SPOUSE, DependantRelationship.CHILD].includes(
      this.props.relationship,
    );
  }

  /**
   * Check if this person falls under S.29(b) - Must prove maintenance
   */
  public isSection29B(): boolean {
    return !this.isSection29A();
  }

  /**
   * Add proof of dependency (School fees, Medical records, Marriage Cert).
   */
  public addEvidence(evidence: DependantEvidence): void {
    // Validate evidence belongs to this dependant?
    // In Entity design, we trust the caller passing the correct child entity.

    this.updateState({
      evidence: [...this.props.evidence, evidence],
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new DependantEvidenceAddedEvent(
        this.id.toString(),
        this.props.estateId,
        evidence.type,
        this.version,
      ),
    );
  }

  /**
   * Verify the claim.
   * STRICT LOGIC: Cannot verify S.29(b) claimants without evidence of maintenance.
   */
  public verifyClaim(verifiedBy: string): void {
    if (this.props.status === DependantStatus.VERIFIED) return;

    // Rule: S.29(b) MUST have evidence
    if (this.isSection29B() && this.props.evidence.length === 0) {
      throw new MissingEvidenceException(
        this.id.toString(),
        'S.29(b) claimants must provide proof of maintenance before verification.',
      );
    }

    // Rule: Spouses must usually provide Marriage Cert
    if (
      this.props.relationship === DependantRelationship.SPOUSE &&
      this.props.evidence.length === 0
    ) {
      // Warning: We enforce this strictly for system integrity
      throw new MissingEvidenceException(
        this.id.toString(),
        'Spouse claim requires Marriage Certificate or Affidavit.',
      );
    }

    this.updateState({
      status: DependantStatus.VERIFIED,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new LegalDependantVerifiedEvent(
        this.id.toString(),
        this.props.estateId,
        verifiedBy,
        this.version,
      ),
    );
  }

  /**
   * Reject the claim (e.g., DNA test failed, or not actually a dependant).
   */
  public rejectClaim(reason: string, rejectedBy: string): void {
    this.updateState({
      status: DependantStatus.REJECTED,
      rejectionReason: reason,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new LegalDependantRejectedEvent(
        this.id.toString(),
        this.props.estateId,
        reason,
        rejectedBy,
        this.version,
      ),
    );
  }
}
