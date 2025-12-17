// domain/dependency/services/dependency-calculation.service.ts
import { Injectable } from '@nestjs/common';

import { FinancialDependencyPolicy } from '../../../domain/policies/financial-dependency.policy';

export interface SuggestedDependencyResult {
  suggestedPercentage: number;
  suggestedLevel: 'FULL' | 'PARTIAL' | 'NONE';
  explanation: string;
  calculationMethod: string;
  confidence: number;
  financialEvidenceRequired: boolean;
}

@Injectable()
export class DependencyCalculationService {
  constructor(private readonly financialDependencyPolicy: FinancialDependencyPolicy) {}

  /**
   * Calculate suggested dependency based on financial data
   */
  calculateSuggestedDependency(params: {
    monthlyNeeds: number;
    monthlyContribution: number;
    totalDeceasedIncome: number;
    dependantBasis: string;
    isMinor: boolean;
    isStudent: boolean;
    hasDisability: boolean;
  }): SuggestedDependencyResult {
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
  calculateEstateDistribution(params: {
    estateValue: number;
    dependants: Array<{
      dependantId: string;
      dependencyPercentage: number;
      isPriority: boolean;
      hasCourtOrder: boolean;
      courtApprovedAmount?: number;
    }>;
    availableAssets: number;
  }): {
    distribution: Array<{
      dependantId: string;
      entitlementAmount: number;
      percentageOfEstate: number;
      priority: number;
      isGuaranteed: boolean;
    }>;
    totalEntitlements: number;
    estateCoverage: number;
    shortfall: number;
    recommendations: string[];
  } {
    const { estateValue, dependants, availableAssets } = params;
    const distribution = [];
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
      let entitlementAmount: number;

      if (dependant.hasCourtOrder && dependant.courtApprovedAmount) {
        // Court order amount is fixed
        entitlementAmount = dependant.courtApprovedAmount;
      } else {
        // Calculate based on dependency percentage
        entitlementAmount = (estateValue * dependant.dependencyPercentage) / 100;
      }

      // Cap at available assets
      const availableForDistribution = availableAssets - totalEntitlements;
      if (entitlementAmount > availableForDistribution) {
        entitlementAmount = availableForDistribution;
        recommendations.push(
          `Insufficient assets for full entitlement of dependant ${dependant.dependantId}`,
        );
      }

      distribution.push({
        dependantId: dependant.dependantId,
        entitlementAmount,
        percentageOfEstate: (entitlementAmount / estateValue) * 100,
        priority: dependant.hasCourtOrder ? 1 : dependant.isPriority ? 2 : 3,
        isGuaranteed: dependant.hasCourtOrder,
      });

      totalEntitlements += entitlementAmount;

      if (totalEntitlements >= availableAssets) {
        recommendations.push('Estate assets fully allocated');
        break;
      }
    }

    const estateCoverage = (totalEntitlements / estateValue) * 100;
    const shortfall = Math.max(0, estateValue - totalEntitlements);

    if (shortfall > 0) {
      recommendations.push(`Estate shortfall of ${shortfall.toLocaleString()} KES`);
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
  calculateMonthlySupport(params: {
    location: string; // County in Kenya
    age: number;
    isStudent: boolean;
    hasDisability: boolean;
    requiresOngoingCare: boolean;
    numberOfDependants?: number;
  }): {
    basicNeeds: number;
    education: number;
    medical: number;
    housing: number;
    other: number;
    totalMonthlyNeeds: number;
    locationAdjustment: number;
    notes: string[];
  } {
    const notes: string[] = [];
    let locationAdjustment = 1.0;

    // Base costs for Nairobi (adjust for other counties)
    let basicNeeds = 15000; // Food, clothing, utilities
    let education = 0;
    let medical = 5000;
    let housing = 20000;
    let other = 10000;

    // Location adjustment
    switch (params.location.toUpperCase()) {
      case 'NAIROBI':
      case 'MOMBASA':
        locationAdjustment = 1.3;
        notes.push('Urban area cost adjustment applied');
        break;
      case 'KISUMU':
      case 'NAKURU':
        locationAdjustment = 1.1;
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

  private buildExplanation(calculation: any, params: any): string {
    const parts: string[] = [];

    parts.push(`Based on monthly needs of ${params.monthlyNeeds.toLocaleString()} KES`);
    parts.push(`and monthly contribution of ${params.monthlyContribution.toLocaleString()} KES`);
    parts.push(`(dependency ratio: ${calculation.dependencyRatio.toFixed(2)})`);

    if (params.hasDisability) {
      parts.push('Disability adjustment applied');
    }

    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(params.dependantBasis)) {
      parts.push('Priority dependant consideration applied');
    }

    parts.push(`Calculation method: ${calculation.calculationMethod}`);
    parts.push(`Confidence score: ${calculation.confidenceScore}%`);

    return parts.join('. ');
  }

  private requiresFinancialEvidence(dependantBasis: string): boolean {
    return !['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(dependantBasis);
  }
}
