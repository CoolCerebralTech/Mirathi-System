import { Injectable } from '@nestjs/common';

import { FinancialDependencyPolicy } from '../policies/financial-dependency.policy';

export interface SuggestedDependencyResult {
  suggestedPercentage: number;
  suggestedLevel: 'FULL' | 'PARTIAL' | 'NONE';
  explanation: string;
  calculationMethod: string;
  confidence: number;
  financialEvidenceRequired: boolean;
}

export interface Dependant {
  dependantId: string;
  dependencyPercentage: number;
  isPriority: boolean;
  hasCourtOrder: boolean;
  courtApprovedAmount?: number;
}

export interface DistributionItem {
  dependantId: string;
  entitlementAmount: number;
  percentageOfEstate: number;
  priority: number;
  isGuaranteed: boolean;
}

export interface EstateDistributionResult {
  distribution: DistributionItem[];
  totalEntitlements: number;
  estateCoverage: number;
  shortfall: number;
  recommendations: string[];
}

export interface MonthlySupportResult {
  basicNeeds: number;
  education: number;
  medical: number;
  housing: number;
  other: number;
  totalMonthlyNeeds: number;
  locationAdjustment: number;
  notes: string[];
}

export interface DependencyCalculationParams {
  monthlyNeeds: number;
  monthlyContribution: number;
  totalDeceasedIncome: number;
  dependantBasis: string;
  isMinor: boolean;
  isStudent: boolean;
  hasDisability: boolean;
}

export interface EstateDistributionParams {
  estateValue: number;
  dependants: Dependant[];
  availableAssets: number;
}

export interface MonthlySupportParams {
  location: string; // County in Kenya
  age: number;
  isStudent: boolean;
  hasDisability: boolean;
  requiresOngoingCare: boolean;
  numberOfDependants?: number;
}

export interface FinancialDependencyCalculation {
  dependencyPercentage: number;
  dependencyLevel: 'FULL' | 'PARTIAL' | 'NONE';
  dependencyRatio: number;
  calculationMethod: string;
  confidenceScore: number;
}

@Injectable()
export class DependencyCalculationService {
  constructor(private readonly financialDependencyPolicy: FinancialDependencyPolicy) {}

  /**
   * Calculate suggested dependency based on financial data
   */
  calculateSuggestedDependency(params: DependencyCalculationParams): SuggestedDependencyResult {
    const calculation = this.financialDependencyPolicy.calculateFinancialDependency({
      monthlyNeeds: params.monthlyNeeds,
      monthlyContribution: params.monthlyContribution,
      totalDeceasedIncome: params.totalDeceasedIncome,
      dependantBasis: params.dependantBasis,
      hasDisability: params.hasDisability,
    });

    // Build explanation
    const explanation = this.buildExplanation(calculation, params);

    return {
      suggestedPercentage: calculation.dependencyPercentage,
      suggestedLevel: calculation.dependencyLevel,
      explanation,
      calculationMethod: calculation.calculationMethod,
      confidence: calculation.confidenceScore,
      financialEvidenceRequired: this.requiresFinancialEvidence(params.dependantBasis),
    };
  }

  /**
   * Calculate dependency distribution for estate planning
   */
  calculateEstateDistribution(params: EstateDistributionParams): EstateDistributionResult {
    const { estateValue, dependants, availableAssets } = params;
    const distribution: DistributionItem[] = [];
    const recommendations: string[] = [];
    let totalEntitlements = 0;

    // Sort dependants by priority (court orders first, then priority dependants)
    const sortedDependants = [...dependants].sort((a, b) => {
      if (a.hasCourtOrder && !b.hasCourtOrder) return -1;
      if (!a.hasCourtOrder && b.hasCourtOrder) return 1;
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return b.dependencyPercentage - a.dependencyPercentage;
    });

    // Calculate entitlements
    for (const dependant of sortedDependants) {
      // Check if we've exhausted available assets
      if (totalEntitlements >= availableAssets) {
        recommendations.push('Estate assets fully allocated');
        break;
      }

      let entitlementAmount: number;
      const remainingAssets = availableAssets - totalEntitlements;

      if (dependant.hasCourtOrder && dependant.courtApprovedAmount) {
        // Court order amount is fixed
        entitlementAmount = dependant.courtApprovedAmount;
      } else {
        // Calculate based on dependency percentage
        entitlementAmount = (estateValue * dependant.dependencyPercentage) / 100;
      }

      // Cap at available assets
      if (entitlementAmount > remainingAssets) {
        entitlementAmount = remainingAssets;
        recommendations.push(
          `Insufficient assets for full entitlement of dependant ${dependant.dependantId}`,
        );
      }

      // Only add if there's an entitlement
      if (entitlementAmount > 0) {
        const distributionItem: DistributionItem = {
          dependantId: dependant.dependantId,
          entitlementAmount,
          percentageOfEstate: (entitlementAmount / estateValue) * 100,
          priority: dependant.hasCourtOrder ? 1 : dependant.isPriority ? 2 : 3,
          isGuaranteed: dependant.hasCourtOrder,
        };

        distribution.push(distributionItem);
        totalEntitlements += entitlementAmount;
      }
    }

    const estateCoverage = estateValue > 0 ? (totalEntitlements / estateValue) * 100 : 0;
    const shortfall = Math.max(0, estateValue - totalEntitlements);

    if (shortfall > 0) {
      recommendations.push(`Estate shortfall of ${this.formatCurrency(shortfall)}`);
    }

    if (totalEntitlements < availableAssets) {
      const unallocated = availableAssets - totalEntitlements;
      recommendations.push(`Unallocated assets: ${this.formatCurrency(unallocated)}`);
    }

    return {
      distribution,
      totalEntitlements,
      estateCoverage,
      shortfall,
      recommendations,
    };
  }

  /**
   * Calculate monthly support needs
   */
  calculateMonthlySupport(params: MonthlySupportParams): MonthlySupportResult {
    const notes: string[] = [];
    let locationAdjustment = 1.0;

    // Base costs for Nairobi (adjust for other counties)
    let basicNeeds = 15000; // Food, clothing, utilities
    let education = 0;
    let medical = 5000;
    let housing = 20000;
    let other = 10000;

    // Location adjustment
    const upperLocation = params.location.toUpperCase();
    switch (upperLocation) {
      case 'NAIROBI':
      case 'MOMBASA':
        locationAdjustment = 1.3;
        notes.push('Urban area cost adjustment applied');
        break;
      case 'KISUMU':
      case 'NAKURU':
        locationAdjustment = 1.1;
        notes.push('County capital adjustment applied');
        break;
      default:
        locationAdjustment = 0.9;
        notes.push('Rural area cost adjustment applied');
    }

    // Age-based adjustments
    if (params.age < 18) {
      basicNeeds *= 0.8;
      education = 10000; // School fees
      notes.push('Minor adjustment applied');
    } else if (params.age >= 60) {
      medical *= 1.5; // Increased medical needs for elderly
      notes.push('Elderly adjustment applied');
    }

    // Student adjustments
    if (params.isStudent) {
      education = 20000; // University/college fees
      basicNeeds *= 1.2; // Additional living expenses
      notes.push('Student adjustment applied');
    }

    // Disability adjustments
    if (params.hasDisability) {
      medical *= 2;
      if (params.requiresOngoingCare) {
        other += 15000; // Caregiver costs
        notes.push('Ongoing care costs included');
      }
      notes.push('Disability adjustment applied');
    }

    // Multiple dependants adjustment
    if (params.numberOfDependants && params.numberOfDependants > 1) {
      const multiplier = 1 + (params.numberOfDependants - 1) * 0.5;
      basicNeeds *= multiplier;
      housing *= 1.2;
      notes.push(`Multiple dependants adjustment (${params.numberOfDependants})`);
    }

    // Apply location adjustment
    basicNeeds *= locationAdjustment;
    education *= locationAdjustment;
    medical *= locationAdjustment;
    housing *= locationAdjustment;
    other *= locationAdjustment;

    const totalMonthlyNeeds = basicNeeds + education + medical + housing + other;

    // Add inflation consideration note
    notes.push('Figures based on current market rates, subject to inflation adjustment');

    return {
      basicNeeds: Math.round(basicNeeds),
      education: Math.round(education),
      medical: Math.round(medical),
      housing: Math.round(housing),
      other: Math.round(other),
      totalMonthlyNeeds: Math.round(totalMonthlyNeeds),
      locationAdjustment,
      notes,
    };
  }

  /**
   * Build human-readable explanation for dependency calculation
   */
  private buildExplanation(
    calculation: FinancialDependencyCalculation,
    params: DependencyCalculationParams,
  ): string {
    const parts: string[] = [];

    parts.push(`Based on monthly needs of ${this.formatCurrency(params.monthlyNeeds)}`);
    parts.push(`and monthly contribution of ${this.formatCurrency(params.monthlyContribution)}`);
    parts.push(`(dependency ratio: ${calculation.dependencyRatio.toFixed(2)})`);

    if (params.isMinor) {
      parts.push('Consideration for minor dependant applied');
    }

    if (params.hasDisability) {
      parts.push('Disability adjustment applied');
    }

    if (params.isStudent) {
      parts.push('Student status considered');
    }

    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(params.dependantBasis)) {
      parts.push('Priority dependant consideration applied');
    }

    parts.push(`Calculation method: ${calculation.calculationMethod}`);
    parts.push(`Confidence score: ${calculation.confidenceScore}%`);

    return parts.join('. ');
  }

  /**
   * Check if financial evidence is required based on dependant basis
   */
  private requiresFinancialEvidence(dependantBasis: string): boolean {
    const priorityDependants = ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'];
    return !priorityDependants.includes(dependantBasis);
  }

  /**
   * Format currency for display (KES)
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Validate estate distribution parameters
   */
  validateEstateParams(params: EstateDistributionParams): string[] {
    const errors: string[] = [];

    if (params.estateValue <= 0) {
      errors.push('Estate value must be greater than 0');
    }

    if (params.availableAssets <= 0) {
      errors.push('Available assets must be greater than 0');
    }

    if (!Array.isArray(params.dependants) || params.dependants.length === 0) {
      errors.push('At least one dependant is required');
    }

    params.dependants.forEach((dependant, index) => {
      if (!dependant.dependantId) {
        errors.push(`Dependant at index ${index} must have an ID`);
      }

      if (dependant.dependencyPercentage < 0 || dependant.dependencyPercentage > 100) {
        errors.push(`Dependant ${dependant.dependantId} has invalid dependency percentage`);
      }

      if (dependant.hasCourtOrder && !dependant.courtApprovedAmount) {
        errors.push(`Dependant ${dependant.dependantId} has court order but no approved amount`);
      }
    });

    return errors;
  }

  /**
   * Calculate summary statistics for estate distribution
   */
  calculateEstateSummary(distribution: DistributionItem[]): {
    totalGuaranteed: number;
    totalDiscretionary: number;
    averageEntitlement: number;
    maxEntitlement: number;
    minEntitlement: number;
  } {
    if (distribution.length === 0) {
      return {
        totalGuaranteed: 0,
        totalDiscretionary: 0,
        averageEntitlement: 0,
        maxEntitlement: 0,
        minEntitlement: 0,
      };
    }

    const guaranteedItems = distribution.filter((item) => item.isGuaranteed);
    const discretionaryItems = distribution.filter((item) => !item.isGuaranteed);

    const totalGuaranteed = guaranteedItems.reduce((sum, item) => sum + item.entitlementAmount, 0);
    const totalDiscretionary = discretionaryItems.reduce(
      (sum, item) => sum + item.entitlementAmount,
      0,
    );
    const totalEntitlements = totalGuaranteed + totalDiscretionary;
    const entitlements = distribution.map((item) => item.entitlementAmount);

    return {
      totalGuaranteed,
      totalDiscretionary,
      averageEntitlement: totalEntitlements / distribution.length,
      maxEntitlement: Math.max(...entitlements),
      minEntitlement: Math.min(...entitlements),
    };
  }
}
