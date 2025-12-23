// src/domain/value-objects/guardianship-powers.vo.ts
import { ValueObject } from '../base/value-object';

export interface GuardianshipPowersProps {
  // Core Legal Powers
  canManageProperty: boolean;
  canConsentMedical: boolean;
  canDecideEducation: boolean;
  canTravelWithWard: boolean;
  canAccessRecords: boolean; // School, medical records

  // 🎯 INNOVATIVE: Smart Restrictions
  financialLimit?: number; // Max transaction without court approval
  requiresCoSignature?: boolean; // Needs another guardian's approval
  geographicRestrictions?: string[]; // Cannot move ward outside these counties
  specialInstructions?: string; // Custom restrictions from court
}

export class GuardianshipPowersVO extends ValueObject<GuardianshipPowersProps> {
  constructor(props: GuardianshipPowersProps) {
    super(props);
  }

  protected validate(): void {
    // Must have at least one power
    if (
      !this.props.canManageProperty &&
      !this.props.canConsentMedical &&
      !this.props.canDecideEducation
    ) {
      throw new Error('Guardianship must have at least one power');
    }

    // Financial limit must be positive if set
    if (this.props.financialLimit !== undefined && this.props.financialLimit <= 0) {
      throw new Error('Financial limit must be positive');
    }
  }

  // 🎯 INNOVATIVE: Auto-calculates if bond is needed for property management
  public requiresPropertyBond(): boolean {
    return this.props.canManageProperty && (this.props.financialLimit || 0) > 100000; // KES 100K threshold
  }

  // 🎯 INNOVATIVE: Check if power combination is valid
  public validatePowerCombination(): string[] {
    const warnings: string[] = [];

    if (this.props.canTravelWithWard && !this.props.canDecideEducation) {
      warnings.push('Travel permission without education control may be limited');
    }

    if (this.props.canManageProperty && !this.props.requiresCoSignature) {
      warnings.push('Property management without co-signature increases risk');
    }

    return warnings;
  }

  // 🎯 INNOVATIVE: Generate human-readable summary
  public getPowerSummary(): string {
    const powers: string[] = [];

    if (this.props.canManageProperty) {
      powers.push('Manage property');
      if (this.props.financialLimit) {
        powers.push(`(Up to KES ${this.props.financialLimit.toLocaleString()})`);
      }
    }

    if (this.props.canConsentMedical) powers.push('Medical consent');
    if (this.props.canDecideEducation) powers.push('Education decisions');
    if (this.props.canTravelWithWard) powers.push('Travel with ward');

    return powers.join(', ');
  }

  public static create(props: GuardianshipPowersProps): GuardianshipPowersVO {
    return new GuardianshipPowersVO(props);
  }

  public toJSON(): Record<string, any> {
    return {
      ...this.props,
      requiresPropertyBond: this.requiresPropertyBond(),
      powerSummary: this.getPowerSummary(),
    };
  }
}
