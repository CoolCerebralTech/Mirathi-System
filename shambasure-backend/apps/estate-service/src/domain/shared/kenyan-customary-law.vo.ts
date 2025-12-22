import { ValueObject } from '../base/value-object';
import { DomainException } from '../exceptions/base-domain.exception';

export class InvalidCustomaryLawException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_CUSTOMARY_LAW');
  }
}

export enum CustomaryLogicRule {
  PATRILINEAL_ONLY = 'PATRILINEAL_ONLY', // Only males inherit
  MATRILINEAL_ONLY = 'MATRILINEAL_ONLY', // Only females inherit
  ELDEST_SON_EXTRA_SHARE = 'ELDEST_SON_EXTRA_SHARE', // "Muramati" share
  LAST_BORN_HOMESTEAD = 'LAST_BORN_HOMESTEAD', // Last born retains main house
  WIDOW_LIFE_INTEREST_ONLY = 'WIDOW_LIFE_INTEREST_ONLY', // Widow cannot sell land
  UNMARRIED_DAUGHTER_RIGHTS = 'UNMARRIED_DAUGHTER_RIGHTS', // Right to use but not sell
  COMMUNITY_ELDERS_VETO = 'COMMUNITY_ELDERS_VETO', // Sales require clan approval
}

export interface CustomaryRuleConfig {
  ruleType: CustomaryLogicRule;
  // Dynamic parameters (e.g., { extraSharePercent: 10 })
  parameters?: Record<string, any>;
  isActive: boolean;
}

interface KenyanCustomaryLawProps {
  tribe: string;
  clan: string;
  subClan?: string;
  rules: CustomaryRuleConfig[];
  authoritySource?: string; // e.g., "Council of Elders Resolution 2024"
}

export class KenyanCustomaryLaw extends ValueObject<KenyanCustomaryLawProps> {
  constructor(props: KenyanCustomaryLawProps) {
    super(props);
  }

  protected validate(): void {
    if (!this.props.tribe || this.props.tribe.trim().length === 0) {
      throw new InvalidCustomaryLawException('Tribe is required');
    }
    if (!this.props.clan || this.props.clan.trim().length === 0) {
      throw new InvalidCustomaryLawException('Clan is required');
    }

    // Validate rules
    if (this.props.rules.length > 0) {
      const uniqueRules = new Set(this.props.rules.map((r) => r.ruleType));
      if (uniqueRules.size !== this.props.rules.length) {
        throw new InvalidCustomaryLawException('Duplicate customary rules defined');
      }
    }
  }

  // --- Factory Methods ---

  static create(
    tribe: string,
    clan: string,
    rules: CustomaryRuleConfig[] = [],
  ): KenyanCustomaryLaw {
    return new KenyanCustomaryLaw({
      tribe,
      clan,
      rules,
    });
  }

  // --- Business Logic ---

  hasRule(rule: CustomaryLogicRule): boolean {
    const found = this.props.rules.find((r) => r.ruleType === rule);
    return found ? found.isActive : false;
  }

  getRuleParam(rule: CustomaryLogicRule, key: string): any {
    const found = this.props.rules.find((r) => r.ruleType === rule);
    if (!found || !found.parameters) return null;
    return found.parameters[key];
  }

  getFormattedCitation(): string {
    return `${this.props.tribe} Customary Law (${this.props.clan} Clan)`;
  }

  // --- Getters ---
  get tribe(): string {
    return this.props.tribe;
  }
  get clan(): string {
    return this.props.clan;
  }

  public toJSON(): Record<string, any> {
    return {
      tribe: this.props.tribe,
      clan: this.props.clan,
      subClan: this.props.subClan,
      activeRules: this.props.rules.filter((r) => r.isActive).map((r) => r.ruleType),
      citation: this.getFormattedCitation(),
    };
  }
}
