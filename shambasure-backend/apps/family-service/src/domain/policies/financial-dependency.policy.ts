import { Injectable } from '@nestjs/common';
import { DependencyLevel } from '@prisma/client';

export interface FinancialDependencyCalculation {
  dependencyPercentage: number;
  dependencyLevel: DependencyLevel;
  dependencyRatio: number;
  suggestedMonthlySupport?: number;
  confidenceScore: number; // 0-100
  calculationMethod: 'FINANCIAL_RATIO' | 'HISTORICAL_AVERAGE' | 'NEEDS_BASED' | 'STATUTORY';
  notes: string[];
}

@Injectable()
export class FinancialDependencyPolicy {
  /**
   * Calculate dependency based on financial ratios
   */
  calculateFinancialDependency(params: {
    monthlyNeeds: number;
    monthlyContribution: number;
    totalDeceasedIncome: number;
    dependantBasis: string;
    hasDisability: boolean;
  }): FinancialDependencyCalculation {
    const {
      monthlyNeeds,
      monthlyContribution,
      totalDeceasedIncome,
      dependantBasis,
      hasDisability,
    } = params;
    const notes: string[] = [];
    const calculationMethod: FinancialDependencyCalculation['calculationMethod'] =
      'FINANCIAL_RATIO';

    // Validate inputs
    if (monthlyNeeds <= 0) {
      throw new Error('Monthly needs must be positive');
    }

    if (monthlyContribution < 0) {
      throw new Error('Monthly contribution cannot be negative');
    }

    if (totalDeceasedIncome <= 0) {
      throw new Error('Total deceased income must be positive');
    }

    // Calculate dependency ratio
    const dependencyRatio = monthlyContribution / monthlyNeeds;

    // Adjust for priority dependants
    let dependencyPercentage = Math.min(dependencyRatio * 100, 100);

    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(dependantBasis)) {
      // Priority dependants get minimum 50% if there was any contribution
      if (monthlyContribution > 0) {
        dependencyPercentage = Math.max(dependencyPercentage, 50);
        notes.push('Priority dependant minimum threshold applied');
      }
    }

    // Adjust for disability
    if (hasDisability) {
      dependencyPercentage = Math.min(dependencyPercentage * 1.2, 100);
      notes.push('Disability adjustment applied (+20%)');
    }

    // Determine dependency level
    let dependencyLevel: DependencyLevel;
    if (dependencyPercentage >= 75) {
      dependencyLevel = DependencyLevel.FULL;
    } else if (dependencyPercentage >= 25) {
      dependencyLevel = DependencyLevel.PARTIAL;
    } else {
      dependencyLevel = DependencyLevel.NONE;
    }

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore({
      dependencyRatio,
      dependantBasis,
      hasDisability,
    });

    // Suggest monthly support if needed
    let suggestedMonthlySupport: number | undefined;
    if (dependencyPercentage > 0 && dependencyPercentage < 100) {
      suggestedMonthlySupport = (monthlyNeeds * dependencyPercentage) / 100;
    }

    return {
      dependencyPercentage: Math.round(dependencyPercentage * 10) / 10, // Round to 1 decimal
      dependencyLevel,
      dependencyRatio,
      suggestedMonthlySupport,
      confidenceScore,
      calculationMethod,
      notes,
    };
  }

  /**
   * Calculate based on historical average
   */
  calculateHistoricalAverage(params: {
    historicalPayments: number[];
    currentNeeds: number;
    dependantBasis: string;
  }): FinancialDependencyCalculation {
    const { historicalPayments, currentNeeds, dependantBasis } = params;
    const notes: string[] = [];

    if (historicalPayments.length === 0) {
      throw new Error('Historical payments data required');
    }

    // Calculate average historical payment
    const averagePayment =
      historicalPayments.reduce((sum, payment) => sum + payment, 0) / historicalPayments.length;

    // Calculate dependency ratio based on current needs
    const dependencyRatio = averagePayment / currentNeeds;
    let dependencyPercentage = Math.min(dependencyRatio * 100, 100);

    // Adjust for dependant type
    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(dependantBasis)) {
      dependencyPercentage = Math.max(dependencyPercentage, 50);
      notes.push('Historical average adjusted for priority dependant');
    }

    const dependencyLevel = this.determineDependencyLevel(dependencyPercentage);
    const confidenceScore = this.calculateHistoricalConfidence(historicalPayments);

    return {
      dependencyPercentage: Math.round(dependencyPercentage * 10) / 10,
      dependencyLevel,
      dependencyRatio,
      confidenceScore,
      calculationMethod: 'HISTORICAL_AVERAGE',
      notes,
    };
  }

  /**
   * Calculate based on statutory requirements
   */
  calculateStatutoryDependency(params: {
    dependantBasis: string;
    isMinor: boolean;
    isStudent: boolean;
    hasDisability: boolean;
  }): FinancialDependencyCalculation {
    const { dependantBasis, isMinor, isStudent, hasDisability } = params;
    const notes: string[] = [];

    // Statutory percentages based on Kenyan Law of Succession Act
    let dependencyPercentage = 0;

    switch (dependantBasis) {
      case 'SPOUSE':
        dependencyPercentage = 100;
        notes.push('Statutory: Spouse entitled to full dependency');
        break;
      case 'CHILD':
      case 'ADOPTED_CHILD':
        if (isMinor || isStudent) {
          dependencyPercentage = 100;
          notes.push('Statutory: Minor/student child entitled to full dependency');
        } else {
          dependencyPercentage = 50;
          notes.push('Statutory: Adult child entitled to 50% dependency');
        }
        break;
      case 'PARENT':
        dependencyPercentage = 30;
        notes.push('Statutory: Parent entitled to 30% dependency');
        break;
      case 'SIBLING':
        dependencyPercentage = 20;
        notes.push('Statutory: Sibling entitled to 20% dependency');
        break;
      default:
        dependencyPercentage = 10;
        notes.push('Statutory: Other dependant entitled to 10% dependency');
    }

    // Disability adjustment
    if (hasDisability) {
      dependencyPercentage = Math.min(dependencyPercentage * 1.5, 100);
      notes.push('Statutory disability adjustment applied (+50%)');
    }

    const dependencyLevel = this.determineDependencyLevel(dependencyPercentage);

    return {
      dependencyPercentage: Math.round(dependencyPercentage * 10) / 10,
      dependencyLevel,
      dependencyRatio: dependencyPercentage / 100,
      confidenceScore: 95, // High confidence for statutory calculations
      calculationMethod: 'STATUTORY',
      notes,
    };
  }

  private determineDependencyLevel(percentage: number): DependencyLevel {
    if (percentage >= 75) return DependencyLevel.FULL;
    if (percentage >= 25) return DependencyLevel.PARTIAL;
    return DependencyLevel.NONE;
  }

  private calculateConfidenceScore(params: {
    dependencyRatio: number;
    dependantBasis: string;
    hasDisability: boolean;
  }): number {
    let score = 70; // Base score

    // Higher confidence for clear financial ratios
    if (params.dependencyRatio >= 0.3 && params.dependencyRatio <= 0.8) {
      score += 10;
    }

    // Higher confidence for priority dependants
    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(params.dependantBasis)) {
      score += 10;
    }

    // Lower confidence for edge cases
    if (params.dependencyRatio > 0.9) {
      score -= 5; // Very high dependency might need verification
    }

    if (params.hasDisability) {
      score += 5; // Disability adds clarity to dependency needs
    }

    return Math.min(Math.max(score, 0), 100);
  }

  private calculateHistoricalConfidence(payments: number[]): number {
    if (payments.length === 0) return 0;

    let score = 60; // Base score for historical data

    // More data points = higher confidence
    if (payments.length >= 12) {
      score += 20;
    } else if (payments.length >= 6) {
      score += 10;
    }

    // Consistency check (standard deviation)
    const avg = payments.reduce((s, p) => s + p, 0) / payments.length;
    const variance = payments.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / payments.length;
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = stdDev / avg;

    if (coeffOfVariation < 0.2) {
      score += 15; // Very consistent payments
    } else if (coeffOfVariation < 0.5) {
      score += 5; // Moderately consistent
    } else {
      score -= 10; // Inconsistent payments
    }

    return Math.min(Math.max(score, 0), 100);
  }
}
