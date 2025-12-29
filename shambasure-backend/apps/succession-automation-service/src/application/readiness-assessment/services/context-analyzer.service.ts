import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  SuccessionContext,
  SuccessionMarriageType,
  SuccessionRegime,
  SuccessionReligion,
} from '../../../domain/value-objects/succession-context.vo';
import { I_ESTATE_SERVICE, I_FAMILY_SERVICE } from '../interfaces/adapters.interface';
// FIX: Use 'import type' for interfaces used in constructor
import type {
  IEstateServiceAdapter,
  IFamilyServiceAdapter,
} from '../interfaces/adapters.interface';

@Injectable()
export class ContextAnalyzerService {
  private readonly logger = new Logger(ContextAnalyzerService.name);

  constructor(
    @Inject(I_FAMILY_SERVICE) private readonly familyService: IFamilyServiceAdapter,
    @Inject(I_ESTATE_SERVICE) private readonly estateService: IEstateServiceAdapter,
  ) {}

  /**
   * Analyzes raw data from Estate and Family services to build a SuccessionContext
   */
  async analyzeContext(estateId: string, familyId: string): Promise<SuccessionContext> {
    this.logger.log(`Analyzing context for Estate: ${estateId}`);

    // 1. Fetch Data in Parallel
    const [familyData, estateData, willData] = await Promise.all([
      this.familyService.getFamilyStructure(familyId),
      this.estateService.getEstateSummary(estateId),
      this.estateService.getWillDetails(estateId),
    ]);

    // 2. Determine Regime (Testate vs Intestate)
    let regime = SuccessionRegime.INTESTATE;
    if (willData.exists && willData.isValid) {
      regime = SuccessionRegime.TESTATE;
    } else if (willData.exists && !willData.isValid) {
      this.logger.warn(`Invalid Will detected for Estate ${estateId}. Defaulting to Intestate.`);
    }

    // 3. Map Marriage Type
    const marriageType = this.mapMarriageType(familyData.marriageType);

    // 4. Map Religion
    const religion = this.mapReligion(familyData.religion);

    // 5. Calculate Complexity Score
    const complexityScore = this.calculateComplexity(
      estateData.grossValue,
      familyData.hasDisputes || estateData.isDisputed,
      familyData.marriageType === 'POLYGAMOUS',
      estateData.hasBusinessAssets,
    );

    // 6. Build the Value Object
    return SuccessionContext.create({
      regime,
      marriageType,
      religion,
      isMinorInvolved: familyData.hasMinors,
      hasDisputedAssets: estateData.isDisputed || familyData.hasDisputes,
      estimatedComplexityScore: complexityScore,
      totalBeneficiaries: familyData.beneficiaryCount,
      estateValueKES: estateData.grossValue,
      isEstateInsolvent: estateData.grossValue < estateData.totalDebts,
      isBusinessAssetsInvolved: estateData.hasBusinessAssets,
      isForeignAssetsInvolved: estateData.hasForeignAssets,
      isCharitableBequest: false,
      hasDependantsWithDisabilities: false,
    });
  }

  // --- Helpers ---

  private mapMarriageType(type: string): SuccessionMarriageType {
    const map: Record<string, SuccessionMarriageType> = {
      MONOGAMOUS: SuccessionMarriageType.MONOGAMOUS,
      POLYGAMOUS: SuccessionMarriageType.POLYGAMOUS,
      COHABITATION: SuccessionMarriageType.COHABITATION,
      SINGLE: SuccessionMarriageType.SINGLE,
    };
    return map[type] || SuccessionMarriageType.MONOGAMOUS;
  }

  private mapReligion(religion: string): SuccessionReligion {
    const map: Record<string, SuccessionReligion> = {
      CHRISTIAN: SuccessionReligion.CHRISTIAN,
      ISLAMIC: SuccessionReligion.ISLAMIC,
      HINDU: SuccessionReligion.HINDU,
      TRADITIONAL: SuccessionReligion.AFRICAN_CUSTOMARY,
    };
    return map[religion] || SuccessionReligion.STATUTORY;
  }

  private calculateComplexity(
    value: number,
    disputed: boolean,
    polygamous: boolean,
    business: boolean,
  ): number {
    let score = 1;
    if (value > 20_000_000) score += 2;
    if (disputed) score += 3;
    if (polygamous) score += 2;
    if (business) score += 2;
    return Math.min(10, score);
  }
}
