import { FamilyMember } from '../../entities/family-member.entity';
import { LegalDependant } from '../../entities/legal-dependant.entity';

export interface IDependencyCalculatorService {
  // Basic dependency calculation
  calculateDependencyLevel(dependant: {
    age: number;
    disabilityStatus?: string;
    studentStatus?: boolean;
    employmentStatus?: string;
    income?: number;
  }): Promise<{
    level: 'NONE' | 'PARTIAL' | 'FULL';
    score: number;
    factors: Array<{
      factor: string;
      weight: number;
      contribution: number;
    }>;
  }>;

  // Financial dependency calculation
  calculateFinancialDependency(
    dependant: LegalDependant,
    deceased: {
      monthlyIncome: number;
      totalAssets: number;
      regularExpenses: number;
    },
  ): Promise<{
    monthlyNeed: number;
    percentageOfIncome: number;
    durationEstimate: number; // in months
    sustainabilityScore: number;
  }>;

  // S.29 LSA dependency assessment
  assessSection29Dependency(
    dependant: FamilyMember,
    deceased: FamilyMember,
    context: {
      relationship: string;
      cohabitationDuration?: number;
      childrenInCommon?: number;
    },
  ): Promise<{
    qualifies: boolean;
    basis: string[];
    strength: 'STRONG' | 'MODERATE' | 'WEAK';
    evidenceRequirements: string[];
  }>;

  // Monthly support calculation
  calculateMonthlySupport(dependant: {
    age: number;
    needs: string[]; // 'education', 'medical', 'housing', 'food', 'other'
    location: string;
    specialRequirements?: string[];
  }): Promise<{
    basicNeeds: number;
    specialNeeds: number;
    totalMonthly: number;
    breakdown: Map<string, number>;
  }>;

  // Dependency duration
  estimateDependencyDuration(dependant: {
    age: number;
    studentUntil?: Date;
    disabilityType?: string;
    recoveryPrognosis?: string;
  }): Promise<{
    estimatedEndDate?: Date;
    durationMonths: number;
    certainty: 'HIGH' | 'MEDIUM' | 'LOW';
    reviewTriggers: string[];
  }>;

  // Multiple dependants allocation
  allocateSupportAmongDependants(
    totalAvailable: number,
    dependants: LegalDependant[],
  ): Promise<Map<string, number>>; // dependantId -> allocation

  // Court provision recommendation
  recommendCourtProvision(
    dependant: LegalDependant,
    estateValue: number,
    otherDependants: LegalDependant[],
  ): Promise<{
    recommendedAmount: number;
    percentageOfEstate: number;
    paymentStructure: 'LUMP_SUM' | 'MONTHLY' | 'TRUST';
    justification: string[];
  }>;

  // Inflation adjustment
  calculateInflationAdjustedSupport(
    baseAmount: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    adjustedAmount: number;
    inflationRate: number;
    monthlyAdjustments: Array<{
      month: Date;
      amount: number;
    }>;
  }>;

  // Cost of living adjustment
  adjustForCostOfLiving(
    amount: number,
    location: string,
    date: Date,
  ): Promise<{
    adjustedAmount: number;
    costOfLivingIndex: number;
    comparisonToNationalAverage: number;
  }>;

  // Dependency impact on estate
  calculateEstateImpact(
    dependants: LegalDependant[],
    estateValue: number,
    otherLiabilities: number,
  ): Promise<{
    totalDependencyClaim: number;
    percentageOfEstate: number;
    remainingForOtherHeirs: number;
    sustainability: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendations: string[];
  }>;

  // Dependency review scheduling
  scheduleDependencyReview(
    dependant: LegalDependant,
    lastAssessmentDate: Date,
  ): Promise<{
    nextReviewDate: Date;
    reviewFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'BIENNIAL';
    reviewTriggers: string[];
  }>;

  // Dependency termination assessment
  assessDependencyTermination(
    dependant: LegalDependant,
    currentDate: Date,
  ): Promise<{
    shouldTerminate: boolean;
    reasons: string[];
    terminationDate?: Date;
    noticeRequired: boolean;
    noticePeriodDays: number;
  }>;
}
