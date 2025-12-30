// src/family-service/src/domain/value-objects/family-metadata.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Clan & Totem System Value Object
 *
 * Innovations:
 * 1. Multi-ethnic clan system support
 * 2. Totem animal tracking (spiritual significance)
 * 3. Sub-clan hierarchy
 * 4. Clan alliance tracking
 * 5. Migration history mapping
 */
export interface ClanMetadataProps {
  clanName: string;
  subClan?: string;
  totemAnimal?: string;
  ancestralHome?: string;
  migrationRoute?: string[];
  alliedClans?: string[];
  tabooAnimals?: string[];
  foundingAncestor?: string;
}

export class ClanMetadata extends ValueObject<ClanMetadataProps> {
  private static readonly COMMON_TOTEMS = [
    'ELEPHANT',
    'LION',
    'LEOPARD',
    'BUFFALO',
    'RHINO',
    'EAGLE',
    'HYENA',
    'MONKEY',
    'COBRA',
    'CROCODILE',
    'BEE',
    'ANT',
    'GRASSHOPPER',
    'FISH',
    'TURTLE',
  ];

  private static readonly TABOO_RULES = {
    ELEPHANT: ['Cannot kill or eat elephant'],
    LION: ['Cannot hunt lions'],
    EAGLE: ['Cannot harm birds of prey'],
    COBRA: ['Must protect snakes'],
    BEE: ['Must protect beehives'],
  };

  protected validate(): void {
    if (!this.props.clanName || this.props.clanName.trim().length < 2) {
      throw new ValueObjectValidationError('Clan name must be at least 2 characters', 'clanName');
    }

    // Validate totem if provided
    if (this.props.totemAnimal && this.props.totemAnimal.trim().length > 0) {
      const totem = this.props.totemAnimal.toUpperCase();
      if (!ClanMetadata.COMMON_TOTEMS.includes(totem)) {
        throw new ValueObjectValidationError(
          `Uncommon totem animal: ${this.props.totemAnimal}. Common totems: ${ClanMetadata.COMMON_TOTEMS.join(', ')}`,
          'totemAnimal',
        );
      }
    }

    // Validate migration route
    if (this.props.migrationRoute && this.props.migrationRoute.length > 0) {
      if (this.props.migrationRoute.length > 10) {
        throw new ValueObjectValidationError(
          'Migration route cannot have more than 10 locations',
          'migrationRoute',
        );
      }
    }
  }

  /**
   * Get clan hierarchy (Clan > Sub-clan > Family)
   */
  public getClanHierarchy(): string[] {
    const hierarchy: string[] = [this.props.clanName];

    if (this.props.subClan) {
      hierarchy.push(this.props.subClan);
    }

    return hierarchy;
  }

  /**
   * Get cultural taboos based on totem
   */
  public getCulturalTaboos(): string[] {
    if (!this.props.totemAnimal) return [];

    const totem = this.props.totemAnimal.toUpperCase();
    return ClanMetadata.TABOO_RULES[totem as keyof typeof ClanMetadata.TABOO_RULES] || [];
  }

  /**
   * Check if two clans are traditionally allied
   */
  public isAlliedWith(otherClan: string): boolean {
    return this.props.alliedClans?.includes(otherClan) || false;
  }

  /**
   * Generate clan greeting/slogan
   */
  public generateClanGreeting(): string {
    const greetings = {
      ELEPHANT: 'Mighty as the elephant, united as one!',
      LION: 'Roaring with pride, standing as kings!',
      EAGLE: 'Soaring high, seeing far!',
      COBRA: 'Wise and protective, striking when needed!',
      BEE: 'Working together, building sweet success!',
    };

    if (this.props.totemAnimal) {
      const totem = this.props.totemAnimal.toUpperCase() as keyof typeof greetings;
      return greetings[totem] || `Strength in ${this.props.clanName}!`;
    }

    return `Greetings from the ${this.props.clanName} clan!`;
  }

  public toJSON(): Record<string, any> {
    return {
      clanName: this.props.clanName,
      subClan: this.props.subClan,
      totemAnimal: this.props.totemAnimal,
      ancestralHome: this.props.ancestralHome,
      migrationRoute: this.props.migrationRoute,
      alliedClans: this.props.alliedClans,
      tabooAnimals: this.props.tabooAnimals,
      clanHierarchy: this.getClanHierarchy(),
      culturalTaboos: this.getCulturalTaboos(),
      greeting: this.generateClanGreeting(),
    };
  }
}

/**
 * Polygamous House Configuration
 *
 * Innovations:
 * 1. S.40 LSA-compliant house management
 * 2. House order tracking (1st, 2nd, 3rd wife)
 * 3. House asset distribution rules
 * 4. House hierarchy and succession
 */
export interface PolygamousHouseProps {
  houseName: string;
  houseOrder: number; // 1, 2, 3...
  wifeName: string;
  establishedDate: Date;
  courtRecognized: boolean;
  houseColor?: string; // For visual identification
  houseSymbol?: string; // Emoji or icon
  specialRules?: Record<string, any>;
}

export class PolygamousHouse extends ValueObject<PolygamousHouseProps> {
  protected validate(): void {
    if (!this.props.houseName || this.props.houseName.trim().length < 2) {
      throw new ValueObjectValidationError('House name must be at least 2 characters', 'houseName');
    }

    if (this.props.houseOrder < 1 || this.props.houseOrder > 10) {
      throw new ValueObjectValidationError('House order must be between 1 and 10', 'houseOrder');
    }

    if (!this.props.wifeName || this.props.wifeName.trim().length < 2) {
      throw new ValueObjectValidationError('Wife name must be provided', 'wifeName');
    }

    if (this.props.establishedDate > new Date()) {
      throw new ValueObjectValidationError(
        'Establishment date cannot be in the future',
        'establishedDate',
      );
    }
  }

  /**
   * Get house display name with order indicator
   */
  public getDisplayName(): string {
    const ordinal = this.getOrdinal(this.props.houseOrder);
    return `${this.props.houseName} (${ordinal} House)`;
  }

  /**
   * Get S.40 distribution weight (older houses may get slightly more)
   */
  public getDistributionWeight(): number {
    // Under S.40, all houses are equal, but custom may favor first house
    return this.props.houseOrder === 1 ? 1.1 : 1.0;
  }

  /**
   * Generate house color if not provided
   */
  public getHouseColor(): string {
    if (this.props.houseColor) return this.props.houseColor;

    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#FFD166',
      '#06D6A0',
      '#118AB2',
      '#073B4C',
      '#7209B7',
      '#F15BB5',
      '#00BBF9',
      '#00F5D4',
    ];

    return colors[(this.props.houseOrder - 1) % colors.length];
  }

  /**
   * Get house symbol/emoji
   */
  public getHouseSymbol(): string {
    if (this.props.houseSymbol) return this.props.houseSymbol;

    const symbols = ['👑', '🏰', '🎯', '🛡️', '⚔️', '🏹', '🪶', '🌳', '🔥', '💎'];
    return symbols[(this.props.houseOrder - 1) % symbols.length];
  }

  /**
   * Check if house qualifies for S.40 distribution
   */
  public qualifiesForS40Distribution(): boolean {
    return this.props.courtRecognized || this.props.establishedDate.getFullYear() < 1990;
  }

  private getOrdinal(n: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  public toJSON(): Record<string, any> {
    return {
      houseName: this.props.houseName,
      displayName: this.getDisplayName(),
      houseOrder: this.props.houseOrder,
      wifeName: this.props.wifeName,
      establishedDate: this.props.establishedDate.toISOString(),
      courtRecognized: this.props.courtRecognized,
      houseColor: this.getHouseColor(),
      houseSymbol: this.getHouseSymbol(),
      distributionWeight: this.getDistributionWeight(),
      qualifiesForS40: this.qualifiesForS40Distribution(),
      specialRules: this.props.specialRules,
    };
  }
}
