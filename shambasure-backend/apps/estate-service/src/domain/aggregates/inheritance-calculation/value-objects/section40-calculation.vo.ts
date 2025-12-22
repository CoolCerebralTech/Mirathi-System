import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';
import { Money } from '../../../shared/money.vo';

export class InvalidPolygamousCalculationException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_POLYGAMOUS_CALCULATION');
  }
}

export interface S40HouseShare {
  houseId: string;
  houseName: string;
  houseOrder: number;

  // Financials
  totalShare: Money;
  spouseShare?: Money; // If specific allocation to the widow
  childrenShareTotal: Money; // Remainder for children

  // Metadata
  beneficiaryCount: number;
  hasMinors: boolean;
}

interface S40CalculationProps {
  // Legal Framework
  appliedSection: 'S40(1)' | 'S40(2)' | 'CUSTOMARY'; // 40(1)=Equal Houses, 40(2)=Court/Will variation

  // Totals
  totalNetEstate: Money;
  totalDistributed: Money;
  unallocatedAmount: Money;

  // Breakdown
  houseShares: S40HouseShare[];

  // Compliance
  requiresCourtApproval: boolean;
  notes: string[];

  // Metadata
  calculatedAt: Date;
}

export class Section40Calculation extends ValueObject<S40CalculationProps> {
  private constructor(props: S40CalculationProps) {
    super(props);
  }

  protected validate(): void {
    // 1. House Existence
    if (this.props.houseShares.length === 0) {
      throw new InvalidPolygamousCalculationException(
        'At least one house is required for Section 40',
      );
    }

    // 2. Financial Integrity
    let sumHouses = 0;
    for (const house of this.props.houseShares) {
      if (house.totalShare.amount < 0) {
        throw new InvalidPolygamousCalculationException(
          `House ${house.houseName} has negative share`,
        );
      }
      sumHouses += house.totalShare.amount;
    }

    // Allow small floating point tolerance (e.g. 1.0 unit)
    const diff = Math.abs(sumHouses - this.props.totalDistributed.amount);
    if (diff > 1.0) {
      throw new InvalidPolygamousCalculationException(
        `Sum of house shares (${sumHouses}) does not match total distributed (${this.props.totalDistributed.amount})`,
      );
    }

    if (this.props.totalDistributed.amount > this.props.totalNetEstate.amount + 1.0) {
      throw new InvalidPolygamousCalculationException('Distributed amount exceeds net estate');
    }
  }

  // --- Factory Method (Reconstitute Result) ---

  static create(props: {
    appliedSection: 'S40(1)' | 'S40(2)' | 'CUSTOMARY';
    totalNetEstate: Money;
    houseShares: S40HouseShare[];
    notes?: string[];
  }): Section40Calculation {
    // Auto-calculate totals
    let totalDistributed = Money.zero(props.totalNetEstate.currency);
    let hasMinors = false;

    for (const house of props.houseShares) {
      totalDistributed = totalDistributed.add(house.totalShare);
      if (house.hasMinors) hasMinors = true;
    }

    let unallocated = Money.zero(props.totalNetEstate.currency);
    if (props.totalNetEstate.amount > totalDistributed.amount) {
      unallocated = props.totalNetEstate.subtract(totalDistributed);
    }

    return new Section40Calculation({
      appliedSection: props.appliedSection,
      totalNetEstate: props.totalNetEstate,
      totalDistributed,
      unallocatedAmount: unallocated,
      houseShares: props.houseShares,
      requiresCourtApproval: hasMinors,
      notes: props.notes || [],
      calculatedAt: new Date(),
    });
  }

  // --- Business Logic ---

  isEqualDivision(): boolean {
    if (this.props.houseShares.length <= 1) return true;

    const firstShare = this.props.houseShares[0].totalShare.amount;
    // Check if all shares are roughly equal (within 1% tolerance)
    return this.props.houseShares.every(
      (h) => Math.abs(h.totalShare.amount - firstShare) < firstShare * 0.01,
    );
  }

  getHouseCount(): number {
    return this.props.houseShares.length;
  }

  // --- Getters ---
  get appliedSection(): string {
    return this.props.appliedSection;
  }
  get totalDistributed(): Money {
    return this.props.totalDistributed;
  }
  get houseShares(): S40HouseShare[] {
    return [...this.props.houseShares];
  }

  public toJSON(): Record<string, any> {
    return {
      section: this.props.appliedSection,
      financials: {
        estate: this.props.totalNetEstate.toJSON(),
        distributed: this.props.totalDistributed.toJSON(),
        unallocated: this.props.unallocatedAmount.toJSON(),
      },
      houses: this.props.houseShares.map((h) => ({
        id: h.houseId,
        name: h.houseName,
        order: h.houseOrder,
        total: h.totalShare.toJSON(),
        spouse: h.spouseShare?.toJSON(),
        minors: h.hasMinors,
      })),
      compliance: {
        requiresCourtApproval: this.props.requiresCourtApproval,
        isEqualDivision: this.isEqualDivision(),
        notes: this.props.notes,
      },
      date: this.props.calculatedAt,
    };
  }
}
