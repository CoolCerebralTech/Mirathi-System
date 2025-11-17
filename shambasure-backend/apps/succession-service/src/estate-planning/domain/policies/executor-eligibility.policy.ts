import { RelationshipType } from '@prisma/client';

export interface ExecutorCandidate {
  id: string;
  userId?: string;
  fullName?: string;
  age?: number;
  relationship?: string;
  relationshipType?: RelationshipType;
  isKenyanResident: boolean;
  hasMentalCapacity: boolean;
  hasCriminalRecord: boolean;
  isBankrupt: boolean;
  professionalBackground?: string;
  experienceWithEstates: boolean;
  willingnessToServe: boolean;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export class ExecutorEligibilityPolicy {
  /**
   * Kenyan Law of Succession Act: Executor eligibility requirements
   * - Must be 18+ years old
   * - Must be of sound mind
   * - Must not be bankrupt
   * - Should have no serious criminal record
   * - Should be willing to serve
   */
  validateEligibility(candidate: ExecutorCandidate): {
    isEligible: boolean;
    issues: string[];
    recommendations: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    // Basic legal requirements
    if (!candidate.age || candidate.age < 18) {
      issues.push('Executor must be at least 18 years old');
      riskLevel = 'HIGH';
    }

    if (!candidate.hasMentalCapacity) {
      issues.push('Executor must be of sound mind');
      riskLevel = 'HIGH';
    }

    if (candidate.isBankrupt) {
      issues.push('Bankrupt individuals cannot serve as executors');
      riskLevel = 'HIGH';
    }

    if (candidate.hasCriminalRecord) {
      issues.push('Individuals with criminal records may face challenges in court');
      riskLevel = 'MEDIUM';
    }

    if (!candidate.willingnessToServe) {
      issues.push('Executor must be willing to serve');
      riskLevel = 'MEDIUM';
    }

    // Practical considerations
    if (!candidate.isKenyanResident) {
      issues.push(
        'Non-resident executors may face practical difficulties in estate administration',
      );
      riskLevel = 'MEDIUM';
      recommendations.push('Consider appointing a local co-executor or agent');
    }

    if (!candidate.experienceWithEstates) {
      recommendations.push('Inexperienced executor may benefit from professional guidance');
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel;
    }

    // Contact information
    if (!candidate.contactInfo.email && !candidate.contactInfo.phone) {
      issues.push('Executor must have reliable contact information');
      riskLevel = 'MEDIUM';
    }

    // Professional executors
    if (this.isProfessionalExecutor(candidate)) {
      riskLevel = 'LOW';
      recommendations.push('Professional executor appointed - good choice for complex estates');
    }

    // Family executors
    if (candidate.relationshipType && this.isCloseFamily(candidate.relationshipType)) {
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      recommendations.push(
        'Family member executor - consider potential emotional challenges during administration',
      );
    }

    return {
      isEligible: issues.length === 0,
      issues,
      recommendations,
      riskLevel,
    };
  }

  /**
   * Kenyan court considerations for executor appointment
   */
  getCourtConsiderations(candidate: ExecutorCandidate): {
    likelyToBeConfirmed: boolean;
    potentialObjections: string[];
    bondRequirements: string;
  } {
    const considerations = {
      likelyToBeConfirmed: true,
      potentialObjections: [] as string[],
      bondRequirements: 'Standard executor bond required',
    };

    // Factors that might lead to court objections
    if (candidate.hasCriminalRecord) {
      considerations.likelyToBeConfirmed = false;
      considerations.potentialObjections.push('Criminal record may disqualify executor');
    }

    if (candidate.isBankrupt) {
      considerations.likelyToBeConfirmed = false;
      considerations.potentialObjections.push('Bankruptcy disqualifies executor');
    }

    if (!candidate.isKenyanResident) {
      considerations.potentialObjections.push('Non-residency may require additional security');
      considerations.bondRequirements = 'Enhanced bond required for non-resident executor';
    }

    if (!candidate.experienceWithEstates && !this.isProfessionalExecutor(candidate)) {
      considerations.potentialObjections.push(
        'Lack of experience may require professional assistance',
      );
    }

    // Professional executors may have reduced bond requirements
    if (this.isProfessionalExecutor(candidate)) {
      considerations.bondRequirements =
        'Professional executor bond - may have reduced requirements';
    }

    return considerations;
  }

  /**
   * Recommended executor profiles based on estate complexity
   */
  getRecommendedExecutorProfile(estateComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX'): {
    recommendedType: 'FAMILY' | 'PROFESSIONAL' | 'COMBINATION';
    qualifications: string[];
    experienceLevel: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
    considerations: string[];
  } {
    switch (estateComplexity) {
      case 'SIMPLE':
        return {
          recommendedType: 'FAMILY',
          qualifications: [
            'Literate',
            'Basic financial understanding',
            'Good organizational skills',
          ],
          experienceLevel: 'BASIC',
          considerations: [
            "Family member familiar with testator's affairs",
            'Low cost option',
            'May need professional guidance for legal requirements',
          ],
        };

      case 'MODERATE':
        return {
          recommendedType: 'COMBINATION',
          qualifications: [
            'Financial literacy',
            'Knowledge of Kenyan succession law',
            'Experience with administrative tasks',
          ],
          experienceLevel: 'INTERMEDIATE',
          considerations: [
            'Family member with professional co-executor',
            'Balances personal knowledge with professional expertise',
            'Shared responsibility reduces burden',
          ],
        };

      case 'COMPLEX':
        return {
          recommendedType: 'PROFESSIONAL',
          qualifications: [
            'Legal or accounting qualification',
            'Extensive estate administration experience',
            'Knowledge of tax implications',
            'Familiar with Kenyan court procedures',
          ],
          experienceLevel: 'ADVANCED',
          considerations: [
            'Professional executor or trust company',
            'Higher cost but ensures proper administration',
            'Reduces family conflicts',
            'Better handling of complex assets and taxes',
          ],
        };

      default:
        return {
          recommendedType: 'FAMILY',
          qualifications: ['Literate', 'Basic understanding'],
          experienceLevel: 'BASIC',
          considerations: ['Start with family member for simple estates'],
        };
    }
  }

  private isProfessionalExecutor(candidate: ExecutorCandidate): boolean {
    const professionalBackgrounds = [
      'lawyer',
      'advocate',
      'accountant',
      'banker',
      'trust officer',
      'estate planner',
      'financial advisor',
    ];

    return professionalBackgrounds.some(
      (profession) =>
        candidate.professionalBackground?.toLowerCase().includes(profession) ||
        candidate.fullName?.toLowerCase().includes(profession),
    );
  }

  private isCloseFamily(relationship: RelationshipType): boolean {
    const closeRelationships = [
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
      RelationshipType.PARENT,
      RelationshipType.SIBLING,
    ];
    return closeRelationships.includes(relationship);
  }
}
