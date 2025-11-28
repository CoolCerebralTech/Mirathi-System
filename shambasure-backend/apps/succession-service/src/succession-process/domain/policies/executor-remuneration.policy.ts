import { Injectable } from '@nestjs/common';
import { EstateValuation } from '../value-objects/estate-valuation.vo';

export interface ExecutorWork {
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
  durationMonths: number;
  additionalServices: string[];
}

@Injectable()
export class ExecutorRemunerationPolicy {
  private readonly STANDARD_FEE_PERCENTAGE = 0.05; // 5%
  private readonly MAX_FEE_PERCENTAGE = 0.1; // 10% with court approval
  private readonly MIN_FEE_AMOUNT = 50000; // KES 50,000 minimum

  /**
   * Validates and calculates executor remuneration
   */
  calculateRemuneration(
    valuation: EstateValuation,
    work: ExecutorWork,
    proposedFee?: number,
  ): {
    acceptable: boolean;
    recommendedFee: number;
    feeRange: { min: number; max: number };
    breakdown: { description: string; amount: number }[];
    warnings: string[];
    requiresCourtApproval: boolean;
  } {
    const grossValue = valuation.getGrossAmount();
    const warnings: string[] = [];

    // Calculate base fee using standard percentage
    const baseFee = grossValue * this.STANDARD_FEE_PERCENTAGE;

    // Calculate complexity adjustment
    const complexityMultiplier = this.getComplexityMultiplier(work.complexity);
    const adjustedFee = baseFee * complexityMultiplier;

    // Calculate duration adjustment
    const durationAdjustment = this.getDurationAdjustment(work.durationMonths);
    const durationAdjustedFee = adjustedFee * durationAdjustment;

    // Calculate additional service fees
    const additionalFees = this.calculateAdditionalFees(work.additionalServices, grossValue);

    // Calculate final recommended fee
    let recommendedFee = durationAdjustedFee + additionalFees;

    // Ensure minimum fee
    recommendedFee = Math.max(recommendedFee, this.MIN_FEE_AMOUNT);

    // Calculate fee range
    const minFee = Math.max(grossValue * 0.03, this.MIN_FEE_AMOUNT); // 3% minimum
    const maxFee = grossValue * this.MAX_FEE_PERCENTAGE; // 10% maximum

    // Check if proposed fee is acceptable
    let acceptable = true;
    let requiresCourtApproval = false;

    if (proposedFee !== undefined) {
      if (proposedFee > maxFee) {
        acceptable = false;
        warnings.push(
          `Proposed fee exceeds maximum allowable percentage (${this.MAX_FEE_PERCENTAGE * 100}%)`,
        );
      } else if (proposedFee > baseFee * 1.5) {
        requiresCourtApproval = true;
        warnings.push('Fee exceeds standard guideline by more than 50%. Court approval required.');
      } else if (proposedFee < minFee) {
        warnings.push('Proposed fee is below recommended minimum for the work involved');
      }

      // Compare with recommended
      const variance = Math.abs(proposedFee - recommendedFee) / recommendedFee;
      if (variance > 0.3) {
        warnings.push(
          `Proposed fee varies significantly from recommended amount (${(variance * 100).toFixed(1)}% difference)`,
        );
      }
    }

    // Prepare breakdown
    const breakdown: { description: string; amount: number }[] = [
      {
        description: `Base fee (${this.STANDARD_FEE_PERCENTAGE * 100}% of KES ${grossValue.toLocaleString()})`,
        amount: baseFee,
      },
      {
        description: `${work.complexity.toLowerCase()} complexity adjustment`,
        amount: adjustedFee - baseFee,
      },
      {
        description: `${work.durationMonths} months duration adjustment`,
        amount: durationAdjustedFee - adjustedFee,
      },
    ];

    if (additionalFees > 0) {
      breakdown.push({ description: 'Additional services', amount: additionalFees });
    }

    return {
      acceptable,
      recommendedFee: Math.round(recommendedFee),
      feeRange: { min: Math.round(minFee), max: Math.round(maxFee) },
      breakdown,
      warnings,
      requiresCourtApproval,
    };
  }

  /**
   * Validates if fee deduction is appropriate
   */
  validateFeeDeduction(
    estateValue: number,
    feeAmount: number,
    stage: 'INTERIM' | 'FINAL',
  ): { valid: boolean; maxInterimAmount?: number; conditions?: string[] } {
    const conditions: string[] = [];
    let maxInterimAmount: number | undefined;

    if (stage === 'INTERIM') {
      // Limit interim payments to 50% of estimated total
      const estimatedTotalFee = estateValue * this.STANDARD_FEE_PERCENTAGE;
      maxInterimAmount = estimatedTotalFee * 0.5;

      if (feeAmount > maxInterimAmount) {
        conditions.push('Interim fee payment exceeds 50% of estimated total fee');
      }
    }

    // Always require proper accounting
    conditions.push('Fee must be properly accounted for in estate accounts');
    conditions.push('Receipts and documentation must be maintained');

    const valid = feeAmount <= (maxInterimAmount || estateValue * this.MAX_FEE_PERCENTAGE);

    return {
      valid,
      maxInterimAmount,
      conditions: valid ? conditions : [...conditions, 'Fee amount exceeds allowable limits'],
    };
  }

  /**
   * Calculates fee for specific executor tasks
   */
  calculateTaskBasedFee(
    tasks: {
      description: string;
      complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
      estimatedHours: number;
    }[],
    estateValue: number,
  ): { totalFee: number; taskBreakdown: { description: string; fee: number }[] } {
    const hourlyRates = {
      SIMPLE: 5000, // KES 5,000 per hour
      MEDIUM: 7500, // KES 7,500 per hour
      COMPLEX: 10000, // KES 10,000 per hour
    };

    const taskBreakdown = tasks.map((task) => ({
      description: task.description,
      fee: task.estimatedHours * hourlyRates[task.complexity],
    }));

    const totalFee = taskBreakdown.reduce((sum, task) => sum + task.fee, 0);

    // Cap at percentage of estate value
    const maxFee = estateValue * this.STANDARD_FEE_PERCENTAGE;
    const adjustedTotalFee = Math.min(totalFee, maxFee);

    // Adjust breakdown proportionally if capped
    if (adjustedTotalFee < totalFee) {
      const adjustmentRatio = adjustedTotalFee / totalFee;
      taskBreakdown.forEach((task) => {
        task.fee = Math.round(task.fee * adjustmentRatio);
      });
    }

    return {
      totalFee: adjustedTotalFee,
      taskBreakdown,
    };
  }

  private getComplexityMultiplier(complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX'): number {
    const multipliers = {
      SIMPLE: 1.0,
      MEDIUM: 1.3,
      COMPLEX: 1.7,
    };
    return multipliers[complexity];
  }

  private getDurationAdjustment(durationMonths: number): number {
    if (durationMonths <= 6) return 1.0;
    if (durationMonths <= 12) return 1.2;
    if (durationMonths <= 24) return 1.4;
    return 1.6; // Over 2 years
  }

  private calculateAdditionalFees(services: string[], estateValue: number): number {
    let additionalFees = 0;

    services.forEach((service) => {
      switch (service) {
        case 'BUSINESS_VALUATION':
          additionalFees += Math.min(estateValue * 0.01, 500000); // 1% or max 500K
          break;
        case 'LEGAL_PROCEEDINGS':
          additionalFees += Math.min(estateValue * 0.02, 1000000); // 2% or max 1M
          break;
        case 'INTERNATIONAL_ASSETS':
          additionalFees += Math.min(estateValue * 0.015, 750000); // 1.5% or max 750K
          break;
        case 'TAX_COMPLIANCE':
          additionalFees += Math.min(estateValue * 0.005, 250000); // 0.5% or max 250K
          break;
        default:
          additionalFees += 50000; // KES 50,000 for other services
      }
    });

    return additionalFees;
  }
}
