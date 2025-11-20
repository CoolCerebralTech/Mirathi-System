import { Will as PrismaWill } from '@prisma/client';
import {
  Will,
  WillReconstituteProps,
  FuneralWishes,
  DigitalAssetInstructions,
} from '../../../domain/entities/will.entity';

export class WillMapper {
  static toPersistence(will: Will): PrismaWill {
    const funeralWishes = will.getFuneralWishes();
    const digitalInstructions = will.getDigitalAssetInstructions();

    return {
      id: will.getId(),
      title: will.getTitle(),
      status: will.getStatus(),
      testatorId: will.getTestatorId(),

      willDate: will.getWillDate(),
      lastModified: will.getLastModified(),
      versionNumber: will.getVersionNumber(),
      supersedes: will.getSupersedes(),

      activatedAt: will.getActivatedAt(),
      activatedBy: will.getActivatedBy(),
      executedAt: will.getExecutedAt(),
      executedBy: will.getExecutedBy(),
      revokedAt: will.getRevokedAt(),
      revokedBy: will.getRevokedBy(),
      revocationReason: will.getRevocationReason(),

      funeralWishes: funeralWishes ? this.safeStringify(funeralWishes) : null,
      burialLocation: will.getBurialLocation(),
      residuaryClause: will.getResiduaryClause(),
      digitalAssetInstructions: digitalInstructions
        ? this.safeStringify(digitalInstructions)
        : null,
      specialInstructions: will.getSpecialInstructions(),

      requiresWitnesses: will.getRequiresWitnesses(),
      witnessCount: will.getWitnessCount(),
      hasAllWitnesses: will.getHasAllWitnesses(),

      isActive: will.getIsActiveRecord(),
      createdAt: will.getCreatedAt(),
      updatedAt: will.getUpdatedAt(),
      deletedAt: will.getDeletedAt(),
    } as PrismaWill;
  }

  static toDomain(raw: PrismaWill): Will {
    const funeralWishes = this.parseFuneralWishes(raw.funeralWishes);
    const digitalInstructions = this.parseDigitalInstructions(raw.digitalAssetInstructions);

    const reconstituteProps: WillReconstituteProps = {
      id: raw.id,
      title: raw.title,
      status: raw.status,
      testatorId: raw.testatorId,

      willDate: raw.willDate,
      lastModified: raw.lastModified,
      versionNumber: raw.versionNumber,
      supersedes: raw.supersedes,

      activatedAt: raw.activatedAt,
      activatedBy: raw.activatedBy,
      executedAt: raw.executedAt,
      executedBy: raw.executedBy,
      revokedAt: raw.revokedAt,
      revokedBy: raw.revokedBy,
      revocationReason: raw.revocationReason,

      funeralWishes,
      burialLocation: raw.burialLocation,
      residuaryClause: raw.residuaryClause,
      digitalAssetInstructions: digitalInstructions,
      specialInstructions: raw.specialInstructions,

      requiresWitnesses: raw.requiresWitnesses,
      witnessCount: raw.witnessCount,
      hasAllWitnesses: raw.hasAllWitnesses,

      isActiveRecord: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,

      _assetIds: [],
      _beneficiaryIds: [],
      _witnessIds: [],
      legalCapacity: null,
    };

    return Will.reconstitute(reconstituteProps);
  }

  /**
   * Safe JSON stringify with error handling
   */
  private static safeStringify(data: object): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      throw new Error(
        `Failed to serialize data to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Type-safe funeral wishes parsing without any
   */
  private static parseFuneralWishes(funeralWishesData: string | null): FuneralWishes | null {
    if (!funeralWishesData) return null;

    const parseResult = this.safeParseJson(funeralWishesData);
    if (!parseResult.success) {
      console.warn('Failed to parse funeral wishes JSON:', parseResult.error);
      return null;
    }

    return this.validateFuneralWishes(parseResult.data);
  }

  /**
   * Type-safe digital instructions parsing without any
   */
  private static parseDigitalInstructions(
    digitalInstructionsData: string | null,
  ): DigitalAssetInstructions | null {
    if (!digitalInstructionsData) return null;

    const parseResult = this.safeParseJson(digitalInstructionsData);
    if (!parseResult.success) {
      console.warn('Failed to parse digital instructions JSON:', parseResult.error);
      return null;
    }

    return this.validateDigitalInstructions(parseResult.data);
  }

  /**
   * Safe JSON parsing without any type
   */
  private static safeParseJson(
    jsonString: string,
  ): { success: true; data: unknown } | { success: false; error: string } {
    try {
      const parsed: unknown = JSON.parse(jsonString);
      return { success: true, data: parsed };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Strict validation for funeral wishes
   */
  private static validateFuneralWishes(data: unknown): FuneralWishes | null {
    if (typeof data !== 'object' || data === null) {
      return null;
    }

    const obj = data as Record<string, unknown>;
    const wishes: FuneralWishes = {};

    // Validate each field with proper type checking
    if (this.isOptionalString(obj.burialLocation)) {
      wishes.burialLocation = obj.burialLocation;
    }
    if (this.isOptionalString(obj.funeralType)) {
      wishes.funeralType = obj.funeralType;
    }
    if (this.isOptionalString(obj.specificInstructions)) {
      wishes.specificInstructions = obj.specificInstructions;
    }
    if (this.isOptionalString(obj.preferredOfficiant)) {
      wishes.preferredOfficiant = obj.preferredOfficiant;
    }

    return Object.keys(wishes).length > 0 ? wishes : null;
  }

  /**
   * Strict validation for digital asset instructions
   */
  private static validateDigitalInstructions(data: unknown): DigitalAssetInstructions | null {
    if (typeof data !== 'object' || data === null) {
      return null;
    }

    const obj = data as Record<string, unknown>;
    const instructions: DigitalAssetInstructions = {};

    // Validate each field with proper type checking
    if (this.isOptionalString(obj.socialMediaHandling)) {
      instructions.socialMediaHandling = obj.socialMediaHandling;
    }
    if (this.isOptionalString(obj.emailAccountHandling)) {
      instructions.emailAccountHandling = obj.emailAccountHandling;
    }
    if (this.isOptionalString(obj.cryptocurrencyInstructions)) {
      instructions.cryptocurrencyInstructions = obj.cryptocurrencyInstructions;
    }
    if (this.isOptionalString(obj.onlineAccountClosure)) {
      instructions.onlineAccountClosure = obj.onlineAccountClosure;
    }

    return Object.keys(instructions).length > 0 ? instructions : null;
  }

  /**
   * Type guard for optional string fields
   */
  private static isOptionalString(value: unknown): value is string | undefined {
    return value === undefined || typeof value === 'string';
  }
}
