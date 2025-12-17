// application/dependency/services/validation/dependency-validation.service.ts
import { Injectable } from '@nestjs/common';

import { CreateDependencyAssessmentRequest } from '../dto/request/create-dependency-assessment.request';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

@Injectable()
export class DependencyValidationService {
  /**
   * Validate dependency assessment request
   */
  validateDependencyAssessment(request: CreateDependencyAssessmentRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required field validation
    if (!request.deceasedId) {
      errors.push('Deceased ID is required');
    }

    if (!request.dependantId) {
      errors.push('Dependant ID is required');
    }

    if (request.deceasedId === request.dependantId) {
      errors.push('Deceased and dependant cannot be the same person');
    }

    // Dependency basis validation
    if (!this.isValidDependencyBasis(request.dependencyBasis)) {
      errors.push(`Invalid dependency basis: ${request.dependencyBasis}`);
    }

    // Age and student validation
    if (request.isMinor && request.isStudent === false) {
      warnings.push('Minor dependants are typically students');
    }

    if (request.isStudent && !request.isMinor && !request.supportEndDate) {
      warnings.push('Adult students should have an expected support end date');
      suggestions.push('Consider adding supportEndDate for student dependants');
    }

    // Financial validation
    if (request.monthlySupport !== undefined && request.monthlySupport < 0) {
      errors.push('Monthly support cannot be negative');
    }

    if (request.monthlySupport !== undefined && request.monthlySupport > 1000000) {
      warnings.push('Unusually high monthly support amount');
    }

    // Disability validation
    if (
      (request.hasPhysicalDisability || request.hasMentalDisability) &&
      !request.disabilityDetails
    ) {
      warnings.push('Disability details should be provided for disabled dependants');
      suggestions.push('Add disabilityDetails to document the nature of the disability');
    }

    // Date validation
    if (request.supportStartDate && request.supportEndDate) {
      const start = new Date(request.supportStartDate);
      const end = new Date(request.supportEndDate);

      if (start > end) {
        errors.push('Support start date cannot be after end date');
      }
    }

    // Dependency percentage validation
    if (request.dependencyPercentage !== undefined) {
      if (request.dependencyPercentage < 0 || request.dependencyPercentage > 100) {
        errors.push('Dependency percentage must be between 0 and 100');
      }

      if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(request.dependencyBasis)) {
        if (request.dependencyPercentage < 100) {
          warnings.push('Priority dependants typically have 100% dependency');
          suggestions.push('Consider setting dependencyPercentage to 100 for priority dependants');
        }
      }
    }

    // Evidence suggestions
    if (!['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(request.dependencyBasis)) {
      suggestions.push('Non-priority dependants should include evidence documents');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate financial dependency assessment
   */
  validateFinancialAssessment(params: {
    monthlySupportEvidence: number;
    dependencyRatio: number;
    dependencyPercentage: number;
    assessmentMethod: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (params.monthlySupportEvidence < 0) {
      errors.push('Monthly support evidence cannot be negative');
    }

    if (params.dependencyRatio < 0 || params.dependencyRatio > 1) {
      errors.push('Dependency ratio must be between 0 and 1');
    }

    if (params.dependencyPercentage < 0 || params.dependencyPercentage > 100) {
      errors.push('Dependency percentage must be between 0 and 100');
    }

    // Check consistency between ratio and percentage
    const calculatedPercentage = params.dependencyRatio * 100;
    const percentageDifference = Math.abs(calculatedPercentage - params.dependencyPercentage);

    if (percentageDifference > 10) {
      warnings.push(
        `Large difference between calculated percentage (${calculatedPercentage.toFixed(1)}%) and provided percentage (${params.dependencyPercentage}%)`,
      );
      suggestions.push('Verify calculation method and evidence');
    }

    if (!params.assessmentMethod) {
      warnings.push('Assessment method should be specified');
      suggestions.push('Add assessmentMethod to document how dependency was calculated');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate S.26 claim
   */
  validateS26Claim(params: {
    amount: number;
    claimType: string;
    claimReason: string;
    supportingDocuments: any[];
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (params.amount <= 0) {
      errors.push('Claim amount must be positive');
    }

    if (params.amount > 10000000) {
      // 10 million KES
      warnings.push('Claim amount exceeds typical high-value claims');
      suggestions.push('Consider providing additional justification for large claim amount');
    }

    if (!params.claimReason || params.claimReason.length < 20) {
      warnings.push('Claim reason should be detailed and descriptive');
      suggestions.push('Expand claimReason to include specific needs and circumstances');
    }

    if (params.supportingDocuments.length === 0) {
      warnings.push('S.26 claims typically require supporting documents');
      suggestions.push('Include financial records, medical reports, or other evidence');
    }

    // Type-specific validations
    switch (params.claimType) {
      case 'EDUCATION':
        if (!params.supportingDocuments.some((doc) => doc.documentType.includes('EDUCATION'))) {
          suggestions.push('Education claims should include school/university documentation');
        }
        break;
      case 'MEDICAL':
        if (!params.supportingDocuments.some((doc) => doc.documentType.includes('MEDICAL'))) {
          suggestions.push('Medical claims should include medical reports and treatment estimates');
        }
        break;
      case 'HOUSING':
        suggestions.push('Housing claims should include rental agreements or mortgage documents');
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  private isValidDependencyBasis(basis: string): boolean {
    const validBases = [
      'SPOUSE',
      'CHILD',
      'PARENT',
      'SIBLING',
      'ADOPTED_CHILD',
      'EX_SPOUSE',
      'COHABITOR',
    ];
    return validBases.includes(basis);
  }
}
