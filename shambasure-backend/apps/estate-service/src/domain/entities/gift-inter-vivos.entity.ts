// src/estate-service/src/domain/entities/gift-inter-vivos.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  GiftInterVivosContestedEvent,
  GiftInterVivosRegisteredEvent,
  GiftInterVivosStatusChangedEvent,
} from '../events/gift-inter-vivos.event';
import {
  GiftLogicException,
  InvalidGiftValueException,
} from '../exceptions/gift-inter-vivos.exception';
import { MoneyVO } from '../value-objects/money.vo';

export enum GiftStatus {
  CONFIRMED = 'CONFIRMED', // Accepted as a valid gift
  CONTESTED = 'CONTESTED', // Heirs claim it was a loan or theft
  EXCLUDED = 'EXCLUDED', // Court ruled it exempt from Hotchpot
  RECLASSIFIED_AS_LOAN = 'RECLASSIFIED_AS_LOAN', // It must be repaid
}

export interface GiftInterVivosProps {
  estateId: string;
  recipientId: string; // The Heir/Beneficiary who received it
  description: string; // e.g., "Seed capital for business", "Land in Kitengela"

  // Financials
  valueAtTimeOfGift: MoneyVO; // The S.35(3) "Phantom Value"
  dateGiven: Date;

  // Legal Context
  isWarranted: boolean; // Was there a written "Deed of Gift"?
  evidenceDocumentRef?: string;

  // Status
  status: GiftStatus;
  contestReason?: string;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Gift Inter Vivos Entity
 *
 * Implements S.35(3) of the Law of Succession Act (The "Hotchpot" Rule).
 *
 * LEGAL LOGIC:
 * "Where a child has received a gift... that gift shall be taken into account
 * in determining the share of that child."
 *
 * This entity represents "Phantom Assets" - they don't exist in the Estate's
 * physical inventory, but they exist in the Distribution Math.
 */
export class GiftInterVivos extends Entity<GiftInterVivosProps> {
  private constructor(props: GiftInterVivosProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
  }

  public static create(
    props: Omit<GiftInterVivosProps, 'createdAt' | 'updatedAt' | 'version' | 'status'>,
    id?: UniqueEntityID,
  ): GiftInterVivos {
    // Validation: Cannot give negative gifts
    if (props.valueAtTimeOfGift.amount <= 0) {
      throw new InvalidGiftValueException(props.estateId, props.valueAtTimeOfGift.amount);
    }

    // Validation: Gift cannot be in the future
    if (props.dateGiven > new Date()) {
      throw new GiftLogicException('Date of gift cannot be in the future');
    }

    const gift = new GiftInterVivos(
      {
        ...props,
        status: GiftStatus.CONFIRMED, // Default assumption
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );

    gift.addDomainEvent(
      new GiftInterVivosRegisteredEvent(
        gift.id.toString(),
        props.estateId,
        props.recipientId,
        props.valueAtTimeOfGift.amount,
        props.version,
      ),
    );

    return gift;
  }

  // Getters
  get recipientId(): string {
    return this.props.recipientId;
  }
  get value(): MoneyVO {
    return this.props.valueAtTimeOfGift;
  }
  get status(): GiftStatus {
    return this.props.status;
  }

  /**
   * Returns TRUE if this gift should be added back to the Estate Pool
   * for calculation purposes (Hotchpot).
   */
  public isApplicableForHotchpot(): boolean {
    return this.props.status === GiftStatus.CONFIRMED;
  }

  /**
   * Dispute the gift.
   * Scenario: Other heirs say "That wasn't a gift, he stole it" or "It was a loan".
   * Effect: Freezes this amount in the calculation until resolved.
   */
  public contest(reason: string, contestedBy: string): void {
    if (this.props.status !== GiftStatus.CONFIRMED) {
      throw new GiftLogicException(`Cannot contest a gift that is already ${this.props.status}`);
    }

    this.updateState({
      status: GiftStatus.CONTESTED,
      contestReason: reason,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new GiftInterVivosContestedEvent(
        this.id.toString(),
        this.props.estateId,
        reason,
        contestedBy,
        this.version,
      ),
    );
  }

  /**
   * Resolve a dispute.
   * e.g., Court rules it was indeed a gift, or rules it matches the Hotchpot criteria.
   */
  public upholdAsGift(rulingRef: string, resolvedBy: string): void {
    this.updateState({
      status: GiftStatus.CONFIRMED,
      contestReason: undefined,
      updatedAt: new Date(),
    });

    // Audit event...
  }

  /**
   * Reclassify as Loan.
   * Logic: If it's a loan, it moves to 'Asset' (Account Receivable) and leaves 'Gift'.
   * This entity sets itself to RECLASSIFIED so the Service can create the Asset.
   */
  public reclassifyAsLoan(notes: string, authorizedBy: string): void {
    this.updateState({
      status: GiftStatus.RECLASSIFIED_AS_LOAN,
      contestReason: notes,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new GiftInterVivosStatusChangedEvent(
        this.id.toString(),
        this.props.estateId,
        GiftStatus.CONFIRMED,
        GiftStatus.RECLASSIFIED_AS_LOAN,
        authorizedBy,
        this.version,
      ),
    );
  }
}
