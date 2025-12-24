// domain/services/hotchpot-calculator.service.ts
import { Estate } from '../aggregates/estate.aggregate';
import { GiftInterVivos } from '../entities/gift-inter-vivos.entity';
import { Money } from '../value-objects';

/**
 * Hotchpot Calculator Service
 *
 * Implements Section 35(3), Law of Succession Act
 *
 * LEGAL PRINCIPLE:
 * "When calculating inheritance shares, gifts made during the deceased's
 * lifetime must be 'brought into hotchpot' - i.e., added back to the estate
 * value, and then deducted from the recipient's final share."
 *
 * Example:
 * - Estate at death: 1,000,000 KES
 * - Gift to Child A during life: 200,000 KES (subject to hotchpot)
 * - Hotchpot estate: 1,200,000 KES
 * - 3 children, each entitled to 400,000 KES
 * - Child A already got 200,000, receives only 200,000 more
 * - Child B and C get 400,000 each
 *
 * Business Rules:
 * 1. Only substantial gifts are subject to hotchpot (>10% of estate)
 * 2. Gifts made in contemplation of death (within 5 years typically)
 * 3. Value at time of gift is used (not current value)
 * 4. Appreciation/depreciation doesn't affect hotchpot
 * 5. Executor decides if gift should be included
 *
 * Design Pattern: Domain Service (stateless calculations)
 */

/**
 * Hotchpot Analysis Result
 */
export interface HotchpotAnalysis {
  actualEstateValue: Money;
  totalHotchpotGifts: Money;
  hotchpotAdjustedValue: Money;
  giftsByRecipient: Map<string, RecipientGiftSummary>;
  recommendations: string[];
  warnings: string[];
}

export interface RecipientGiftSummary {
  recipientId: string;
  recipientName: string;
  gifts: GiftSummary[];
  totalGiftValue: Money;
  shouldBeSubjectToHotchpot: boolean;
  adjustmentNeeded: boolean;
}

export interface GiftSummary {
  giftId: string;
  description: string;
  assetType: string;
  valueAtGiftTime: Money;
  currentEstimatedValue?: Money;
  dateOfGift: Date;
  yearsAgo: number;
  isSubjectToHotchpot: boolean;
  hotchpotReason?: string;
  appreciationPercentage: number;
}

/**
 * Hotchpot Decision Criteria
 */
export interface HotchpotDecisionCriteria {
  minimumGiftValuePercentage: number; // Default 10%
  maximumYearsBeforeDeath: number; // Default 5 years
  includeAppreciatedGifts: boolean; // Default false (use original value)
  considerRelationshipToDeceased: boolean;
  courtOrderedInclusion?: string[]; // Gift IDs court ordered to include
  courtOrderedExclusion?: string[]; // Gift IDs court ordered to exclude
}

export class HotchpotCalculatorService {
  private readonly defaultCriteria: HotchpotDecisionCriteria = {
    minimumGiftValuePercentage: 10,
    maximumYearsBeforeDeath: 5,
    includeAppreciatedGifts: false,
    considerRelationshipToDeceased: true,
  };

  /**
   * Analyze all gifts for hotchpot
   */
  public analyzeHotchpot(
    estate: Estate,
    dateOfDeath: Date,
    criteria: Partial<HotchpotDecisionCriteria> = {},
  ): HotchpotAnalysis {
    const mergedCriteria = { ...this.defaultCriteria, ...criteria };

    const actualEstateValue = estate.netEstateValueKES;
    const allGifts = Array.from(estate.giftsInterVivos.values());
    const hotchpotGifts = allGifts.filter((g) => g.isSubjectToHotchpot && g.isVerified);

    // Calculate total hotchpot value
    const totalHotchpotGifts = Money.sum(hotchpotGifts.map((g) => g.getHotchpotValue()));
    const hotchpotAdjustedValue = actualEstateValue.add(totalHotchpotGifts);

    // Group gifts by recipient
    const giftsByRecipient = this.groupGiftsByRecipient(
      allGifts,
      dateOfDeath,
      actualEstateValue,
      mergedCriteria,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      allGifts,
      actualEstateValue,
      dateOfDeath,
      mergedCriteria,
    );

    // Identify warnings
    const warnings = this.identifyWarnings(allGifts, actualEstateValue, hotchpotAdjustedValue);

    return {
      actualEstateValue,
      totalHotchpotGifts,
      hotchpotAdjustedValue,
      giftsByRecipient,
      recommendations,
      warnings,
    };
  }

  /**
   * Group gifts by recipient with analysis
   */
  private groupGiftsByRecipient(
    gifts: GiftInterVivos[],
    dateOfDeath: Date,
    estateValue: Money,
    criteria: HotchpotDecisionCriteria,
  ): Map<string, RecipientGiftSummary> {
    const groupedMap = new Map<string, RecipientGiftSummary>();

    for (const gift of gifts) {
      const recipientId = gift.recipientId.toString();

      if (!groupedMap.has(recipientId)) {
        groupedMap.set(recipientId, {
          recipientId,
          recipientName: 'Recipient', // Would come from Family Service
          gifts: [],
          totalGiftValue: Money.zero(),
          shouldBeSubjectToHotchpot: false,
          adjustmentNeeded: false,
        });
      }

      const summary = groupedMap.get(recipientId)!;

      const yearsAgo = this.calculateYearsAgo(gift.dateOfGift, dateOfDeath);
      const appreciationPercentage = gift.getAppreciationPercentage();

      summary.gifts.push({
        giftId: gift.id.toString(),
        description: gift.description,
        assetType: gift.assetType.value,
        valueAtGiftTime: gift.valueAtGiftTime,
        currentEstimatedValue: gift.currentEstimatedValue,
        dateOfGift: gift.dateOfGift,
        yearsAgo,
        isSubjectToHotchpot: gift.isSubjectToHotchpot,
        hotchpotReason: gift.hotchpotReason,
        appreciationPercentage,
      });

      summary.totalGiftValue = summary.totalGiftValue.add(gift.valueAtGiftTime);

      // Check if should be subject to hotchpot
      const assessment = gift.assessHotchpotEligibility(estateValue, dateOfDeath);
      if (assessment.shouldInclude && !gift.isSubjectToHotchpot) {
        summary.adjustmentNeeded = true;
      }

      summary.shouldBeSubjectToHotchpot =
        summary.shouldBeSubjectToHotchpot || assessment.shouldInclude;
    }

    return groupedMap;
  }

  /**
   * Calculate years between gift and death
   */
  private calculateYearsAgo(giftDate: Date, deathDate: Date): number {
    const milliseconds = deathDate.getTime() - giftDate.getTime();
    const years = milliseconds / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(years);
  }

  /**
   * Generate recommendations for executor
   */
  private generateRecommendations(
    gifts: GiftInterVivos[],
    estateValue: Money,
    dateOfDeath: Date,
    criteria: HotchpotDecisionCriteria,
  ): string[] {
    const recommendations: string[] = [];

    // Check for gifts that should be included but aren't
    const shouldBeIncluded = gifts.filter((g) => {
      if (g.isSubjectToHotchpot) return false; // Already included
      const assessment = g.assessHotchpotEligibility(estateValue, dateOfDeath);
      return assessment.shouldInclude;
    });

    if (shouldBeIncluded.length > 0) {
      recommendations.push(
        `${shouldBeIncluded.length} gift(s) meet hotchpot criteria but are not currently included.`,
      );
      recommendations.push(
        'Review these gifts and consider including them in hotchpot calculation.',
      );
    }

    // Check for gifts that are included but might not need to be
    const mayNotNeedInclusion = gifts.filter((g) => {
      if (!g.isSubjectToHotchpot) return false; // Not included
      const yearsAgo = this.calculateYearsAgo(g.dateOfGift, dateOfDeath);
      return yearsAgo > criteria.maximumYearsBeforeDeath || !g.isSubstantial(estateValue);
    });

    if (mayNotNeedInclusion.length > 0) {
      recommendations.push(
        `${mayNotNeedInclusion.length} gift(s) are included in hotchpot but may not meet strict criteria.`,
      );
      recommendations.push('Consider if these gifts were truly made in contemplation of death.');
    }

    // Check for large appreciated gifts
    const appreciatedGifts = gifts.filter(
      (g) => g.currentEstimatedValue && g.getAppreciationPercentage() > 50,
    );

    if (appreciatedGifts.length > 0) {
      recommendations.push(
        `${appreciatedGifts.length} gift(s) have appreciated significantly (>50%).`,
      );
      recommendations.push(
        'S.35(3) uses value at time of gift, not current value. Appreciation does not affect hotchpot.',
      );
    }

    // Check for gifts to non-beneficiaries
    const verifiedGifts = gifts.filter((g) => g.isVerified);
    if (verifiedGifts.length < gifts.length) {
      recommendations.push(`${gifts.length - verifiedGifts.length} gift(s) are not yet verified.`);
      recommendations.push(
        'Request supporting documents (deed of gift, transfer documents, witness statements).',
      );
    }

    // General best practice
    if (gifts.length > 0) {
      recommendations.push('Document all hotchpot decisions clearly for potential court review.');
      recommendations.push('Consider obtaining legal opinion for gifts near the threshold.');
    }

    return recommendations;
  }

  /**
   * Identify warnings
   */
  private identifyWarnings(
    gifts: GiftInterVivos[],
    estateValue: Money,
    hotchpotValue: Money,
  ): string[] {
    const warnings: string[] = [];

    // Warning 1: Hotchpot significantly increases estate
    if (!estateValue.isZero()) {
      const increasePercentage =
        ((hotchpotValue.getAmount() - estateValue.getAmount()) / estateValue.getAmount()) * 100;

      if (increasePercentage > 50) {
        warnings.push(
          `Hotchpot increases estate value by ${increasePercentage.toFixed(1)}% - may be challenged by beneficiaries.`,
        );
      }
    }

    // Warning 2: Unverified gifts with high value
    const unverifiedHighValue = gifts.filter(
      (g) => !g.isVerified && g.valueAtGiftTime.greaterThan(estateValue.percentage(5)),
    );

    if (unverifiedHighValue.length > 0) {
      warnings.push(
        `${unverifiedHighValue.length} high-value gift(s) are unverified - may be challenged.`,
      );
    }

    // Warning 3: Gifts that exceed recipient's potential share
    const totalGiftsByRecipient = new Map<string, Money>();

    for (const gift of gifts.filter((g) => g.isSubjectToHotchpot)) {
      const recipientId = gift.recipientId.toString();
      const current = totalGiftsByRecipient.get(recipientId) || Money.zero();
      totalGiftsByRecipient.set(recipientId, current.add(gift.getHotchpotValue()));
    }

    for (const [recipientId, giftValue] of totalGiftsByRecipient) {
      // Assuming equal shares for simplicity - actual calculation would consider family structure
      if (giftValue.greaterThan(hotchpotValue.percentage(30))) {
        warnings.push(
          `Recipient ${recipientId} received gifts exceeding 30% of hotchpot estate - may result in zero final inheritance.`,
        );
      }
    }

    // Warning 4: Gifts made shortly before death
    const recentGifts = gifts.filter((g) => {
      const monthsAgo =
        (new Date().getTime() - g.dateOfGift.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo < 6;
    });

    if (recentGifts.length > 0) {
      warnings.push(
        `${recentGifts.length} gift(s) made within 6 months of death - strongly presumed to be subject to hotchpot.`,
      );
    }

    return warnings;
  }

  /**
   * Calculate adjusted shares after hotchpot deductions
   */
  public calculateAdjustedShares(
    originalShares: Map<string, Money>,
    hotchpotAnalysis: HotchpotAnalysis,
  ): Map<string, AdjustedShare> {
    const adjustedShares = new Map<string, AdjustedShare>();

    for (const [beneficiaryId, originalShare] of originalShares) {
      const recipientGifts = hotchpotAnalysis.giftsByRecipient.get(beneficiaryId);

      if (!recipientGifts) {
        // No gifts - full share
        adjustedShares.set(beneficiaryId, {
          beneficiaryId,
          originalShare,
          hotchpotDeduction: Money.zero(),
          adjustedShare: originalShare,
          giftsReceived: [],
        });
        continue;
      }

      // Calculate deduction
      const hotchpotDeduction = recipientGifts.totalGiftValue;
      const adjustedShare = originalShare.subtract(hotchpotDeduction);

      adjustedShares.set(beneficiaryId, {
        beneficiaryId,
        originalShare,
        hotchpotDeduction,
        adjustedShare: adjustedShare.isNegative() ? Money.zero() : adjustedShare,
        giftsReceived: recipientGifts.gifts,
      });
    }

    return adjustedShares;
  }

  /**
   * Generate hotchpot report
   */
  public generateHotchpotReport(analysis: HotchpotAnalysis): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('HOTCHPOT CALCULATION (S.35(3) LAW OF SUCCESSION ACT)');
    lines.push('='.repeat(80));
    lines.push('');

    lines.push('ESTATE VALUES:');
    lines.push('-'.repeat(80));
    lines.push(`Actual Estate (at death):        ${analysis.actualEstateValue.format()}`);
    lines.push(`Add: Gifts Inter Vivos:          ${analysis.totalHotchpotGifts.format()}`);
    lines.push(`Hotchpot-Adjusted Estate Value:  ${analysis.hotchpotAdjustedValue.format()}`);
    lines.push('');

    if (analysis.giftsByRecipient.size > 0) {
      lines.push('GIFTS BY RECIPIENT:');
      lines.push('-'.repeat(80));

      for (const [recipientId, summary] of analysis.giftsByRecipient) {
        lines.push(`Recipient: ${summary.recipientName}`);
        lines.push(`Total Gifts: ${summary.totalGiftValue.format()}`);
        lines.push(
          `Should Be Subject to Hotchpot: ${summary.shouldBeSubjectToHotchpot ? 'Yes' : 'No'}`,
        );

        summary.gifts.forEach((gift) => {
          lines.push('');
          lines.push(`  Gift: ${gift.description}`);
          lines.push(`  Type: ${gift.assetType}`);
          lines.push(`  Value at Gift Time: ${gift.valueAtGiftTime.format()}`);
          if (gift.currentEstimatedValue) {
            lines.push(`  Current Value: ${gift.currentEstimatedValue.format()}`);
            lines.push(`  Appreciation: ${gift.appreciationPercentage.toFixed(1)}%`);
          }
          lines.push(
            `  Date: ${gift.dateOfGift.toISOString().split('T')[0]} (${gift.yearsAgo} years ago)`,
          );
          lines.push(`  Subject to Hotchpot: ${gift.isSubjectToHotchpot ? 'Yes' : 'No'}`);
          if (gift.hotchpotReason) {
            lines.push(`  Reason: ${gift.hotchpotReason}`);
          }
        });

        lines.push('');
      }
    }

    if (analysis.warnings.length > 0) {
      lines.push('WARNINGS:');
      lines.push('-'.repeat(80));
      analysis.warnings.forEach((warning) => {
        lines.push(`⚠️  ${warning}`);
      });
      lines.push('');
    }

    if (analysis.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS:');
      lines.push('-'.repeat(80));
      analysis.recommendations.forEach((rec, index) => {
        lines.push(`${index + 1}. ${rec}`);
      });
      lines.push('');
    }

    lines.push('='.repeat(80));
    lines.push('LEGAL NOTE:');
    lines.push('S.35(3) LSA: "Any gift made by the deceased during his lifetime shall be');
    lines.push('brought into account in determining the entitlement of the person who');
    lines.push('received the gift."');
    lines.push('');
    lines.push('Value used: Value at TIME OF GIFT (not current value)');
    lines.push('Appreciation/depreciation does NOT affect hotchpot calculation');
    lines.push('='.repeat(80));
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('='.repeat(80));

    return lines.join('\n');
  }
}

/**
 * Adjusted Share (after hotchpot deductions)
 */
export interface AdjustedShare {
  beneficiaryId: string;
  originalShare: Money;
  hotchpotDeduction: Money;
  adjustedShare: Money;
  giftsReceived: GiftSummary[];
}
