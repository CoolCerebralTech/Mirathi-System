import { ValueObject } from '../base/value-object';
import {
  InvalidOwnershipPercentageException,
  InvalidOwnershipTypeException,
} from '../exceptions/ownership-percentage.exception';
import { Percentage } from './percentage.vo';

export enum OwnershipType {
  SOLE = 'SOLE',
  JOINT_TENANCY = 'JOINT_TENANCY', // Equal shares, survivorship
  TENANCY_IN_COMMON = 'TENANCY_IN_COMMON', // Distinct shares
  COMMUNITY_PROPERTY = 'COMMUNITY_PROPERTY', // Matrimonial
  CUSTOMARY = 'CUSTOMARY', // Trust for family
  LIFE_INTEREST = 'LIFE_INTEREST',
}

export enum KenyanTenureType {
  FREEHOLD = 'FREEHOLD',
  LEASEHOLD = 'LEASEHOLD',
  COMMUNITY_LAND = 'COMMUNITY_LAND',
  GROUP_RANCH = 'GROUP_RANCH',
}

interface OwnershipPercentageProps {
  percentage: Percentage;
  ownershipType: OwnershipType;
  tenureType?: KenyanTenureType;

  // Life Interest Specifics
  isLifeInterest: boolean;
  lifeInterestEndsAt?: Date;

  // Matrimonial Specifics
  isMatrimonialProperty: boolean;
  spouseConsentRequired: boolean;
}

export class OwnershipPercentage extends ValueObject<OwnershipPercentageProps> {
  constructor(props: OwnershipPercentageProps) {
    super(props);
  }

  protected validate(): void {
    this.validateTypeConstraints();
    this.validateLifeInterest();
  }

  private validateTypeConstraints(): void {
    const { ownershipType, percentage } = this.props;

    if (ownershipType === OwnershipType.SOLE && percentage.value !== 100) {
      throw new InvalidOwnershipTypeException(
        `Sole ownership must be 100%. Got ${percentage.value}%`,
        'SOLE',
      );
    }

    if (ownershipType === OwnershipType.COMMUNITY_PROPERTY && percentage.value !== 50) {
      // While legally debatabale in court, default assumption for matrimonial is 50/50 unless proven otherwise
      // We warn or throw strict based on config. For VO, we enforce consistency if flags say so.
    }
  }

  private validateLifeInterest(): void {
    if (this.props.isLifeInterest && !this.props.lifeInterestEndsAt) {
      throw new InvalidOwnershipPercentageException(
        'Life interest must specify an end date',
        'lifeInterestEndsAt',
      );
    }
  }

  // --- Factory Methods ---

  static createSole(tenure: KenyanTenureType = KenyanTenureType.FREEHOLD): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(100),
      ownershipType: OwnershipType.SOLE,
      tenureType: tenure,
      isLifeInterest: false,
      isMatrimonialProperty: false,
      spouseConsentRequired: false,
    });
  }

  static createJointTenant(
    share: number,
    tenure: KenyanTenureType = KenyanTenureType.FREEHOLD,
  ): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(share),
      ownershipType: OwnershipType.JOINT_TENANCY,
      tenureType: tenure,
      isLifeInterest: false,
      isMatrimonialProperty: false,
      spouseConsentRequired: true, // Joint tenants usually need consent to sever
    });
  }

  static createLifeInterest(share: number, endsAt: Date): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(share),
      ownershipType: OwnershipType.LIFE_INTEREST,
      isLifeInterest: true,
      lifeInterestEndsAt: endsAt,
      isMatrimonialProperty: false,
      spouseConsentRequired: false,
    });
  }

  // --- Business Logic ---

  isActiveLifeInterest(): boolean {
    if (!this.props.isLifeInterest || !this.props.lifeInterestEndsAt) return false;
    return new Date() < this.props.lifeInterestEndsAt;
  }

  isTransferable(): boolean {
    // Life interest is generally not transferable (it extinguishes)
    if (this.props.isLifeInterest) return false;
    return true;
  }

  getLegalDescription(): string {
    const typeStr = this.props.ownershipType.replace(/_/g, ' ').toLowerCase();
    const shareStr = this.props.percentage.format();
    return `${shareStr} as ${typeStr}`;
  }

  // --- Getters ---
  get value(): Percentage {
    return this.props.percentage;
  }
  get type(): OwnershipType {
    return this.props.ownershipType;
  }

  public toJSON(): Record<string, any> {
    return {
      percentage: this.props.percentage.toJSON(),
      type: this.props.ownershipType,
      tenure: this.props.tenureType,
      isLifeInterest: this.props.isLifeInterest,
      isActive: this.isActiveLifeInterest(),
      legalDescription: this.getLegalDescription(),
    };
  }
}
