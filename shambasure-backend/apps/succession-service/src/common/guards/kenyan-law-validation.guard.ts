import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  KENYAN_LAW_CHECK_KEY,
  KenyanLawCheckOptions,
} from '../decorators/kenyan-law-validation.decorator';

// Extended request type with typed body and params
interface KenyanLawRequest extends Request {
  body: Record<string, unknown>;
  params: Record<string, string>;
}

/**
 * A guard that performs specific Kenyan legal compliance checks on incoming requests.
 *
 * Features:
 * - Validates legal requirements under Kenyan Law of Succession Act
 * - Supports multiple types of legal checks
 * - Context-aware validation with custom field support
 * - Comprehensive error handling with legal section references
 */
@Injectable()
export class KenyanLawValidationGuard implements CanActivate {
  private readonly logger = new Logger(KenyanLawValidationGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<KenyanLawCheckOptions>(
      KENYAN_LAW_CHECK_KEY,
      context.getHandler(),
    );

    // If the decorator is not applied, the guard does nothing.
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<KenyanLawRequest>();

    // Extract contextual data for the legal check

    // Perform the appropriate legal validation
    const result = this.performLegalValidation(options.type, request.body);

    if (!result.isValid) {
      this.logger.warn(
        `Kenyan law validation failed for ${options.type}: ${result.errors.join(', ')}`,
      );
      throw new ForbiddenException(
        `Legal compliance check failed: ${result.errors[0]}`,
        `Violation: ${result.lawSections.join(', ')}`,
      );
    }

    this.logger.debug(`Kenyan law validation passed for ${options.type}`);
    return true;
  }

  /**
   * Perform the appropriate legal validation based on check type
   */
  private performLegalValidation(
    checkType: KenyanLawCheckOptions['type'],
    body: Record<string, unknown>,
  ): { isValid: boolean; errors: string[]; lawSections: string[] } {
    // Use type assertion to fix template literal issues
    const check = checkType as string;

    switch (checkType) {
      case 'WILL_FORMALITIES':
        return this.validateWillFormalities(body);

      case 'TESTATOR_CAPACITY':
        return this.validateTestatorCapacity(body);

      case 'WITNESS_ELIGIBILITY':
        return this.validateWitnessEligibility(body);

      case 'DEPENDANT_PROVISION':
        return this.validateDependantProvision(body);

      case 'PROBATE_APPLICATION':
        return this.validateProbateApplication(body);

      case 'INTESTATE_SUCCESSION':
        return this.validateIntestateSuccession(body);

      case 'EXECUTOR_QUALIFICATION':
        return this.validateExecutorQualification(body);

      case 'MINOR_GUARDIANSHIP':
        return this.validateMinorGuardianship(body);

      default:
        this.logger.error(`Unknown Kenyan law check type: ${check}`);
        return {
          isValid: false,
          errors: [`Unknown legal validation type: ${check}`],
          lawSections: ['Unknown'],
        };
    }
  }

  /**
   * Validate will formalities under Section 11 of Law of Succession Act
   */
  private validateWillFormalities(body: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
    lawSections: string[];
  } {
    const errors: string[] = [];
    const lawSections: string[] = ['Section 11'];

    // Check for required will formalities
    if (!body.willDate) {
      errors.push('Will must have a valid execution date');
    }

    if (!body.testatorId) {
      errors.push('Will must specify a testator');
    }

    // Check for witness requirements
    const witnessCount = this.extractNumber(body.witnessCount) || 0;
    if (witnessCount < 2) {
      errors.push('Will must have at least 2 witnesses as required by Kenyan law');
    }

    return {
      isValid: errors.length === 0,
      errors,
      lawSections,
    };
  }

  /**
   * Validate testator capacity under Section 7 of Law of Succession Act
   */
  private validateTestatorCapacity(body: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
    lawSections: string[];
  } {
    const errors: string[] = [];
    const lawSections: string[] = ['Section 7'];

    // Check testator age (must be 18+ or married)
    const testatorAge = this.extractNumber(body.testatorAge);
    if (testatorAge && testatorAge < 18) {
      const isMarried = body.isMarried === true;
      if (!isMarried) {
        errors.push('Testator must be at least 18 years old or married');
      }
    }

    // Check mental capacity
    if (body.hasMentalCapacity === false) {
      errors.push('Testator must have mental capacity to make a will');
    }

    return {
      isValid: errors.length === 0,
      errors,
      lawSections,
    };
  }

  /**
   * Validate witness eligibility under Section 11 requirements
   */
  private validateWitnessEligibility(body: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
    lawSections: string[];
  } {
    const errors: string[] = [];
    const lawSections: string[] = ['Section 11'];

    // Witnesses cannot be beneficiaries
    if (body.isWitnessAlsoBeneficiary === true) {
      errors.push('Witness cannot be a beneficiary under Kenyan law');
    }

    // Witnesses must be competent
    if (body.witnessIsMinor === true) {
      errors.push('Witness must be at least 18 years old');
    }

    return {
      isValid: errors.length === 0,
      errors,
      lawSections,
    };
  }

  /**
   * Validate dependant provision under Sections 26-29
   */
  private validateDependantProvision(body: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
    lawSections: string[];
  } {
    const errors: string[] = [];
    const lawSections: string[] = ['Sections 26-29'];

    // Check if reasonable provision is made for dependants
    const hasDependantProvision = body.hasDependantProvision === true;
    const dependants = this.extractArray(body.dependants);

    if (dependants && dependants.length > 0 && !hasDependantProvision) {
      errors.push('Reasonable provision must be made for dependants');
    }

    return {
      isValid: errors.length === 0,
      errors,
      lawSections,
    };
  }

  /**
   * Validate probate application requirements
   */
  private validateProbateApplication(body: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
    lawSections: string[];
  } {
    const errors: string[] = [];
    const lawSections: string[] = ['Probate and Administration Act'];

    // Basic probate requirements
    if (!body.deceasedName) {
      errors.push('Deceased name is required for probate application');
    }

    if (!body.dateOfDeath) {
      errors.push('Date of death is required for probate application');
    }

    return {
      isValid: errors.length === 0,
      errors,
      lawSections,
    };
  }

  /**
   * Validate intestate succession rules under Part V
   */
  private validateIntestateSuccession(body: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
    lawSections: string[];
  } {
    const errors: string[] = [];
    const lawSections: string[] = ['Part V'];

    // Check for surviving spouse and children
    const hasSurvivingSpouse = body.hasSurvivingSpouse === true;
    const hasChildren = body.hasChildren === true;

    if (!hasSurvivingSpouse && !hasChildren) {
      errors.push('Intestate succession requires determination of heirs according to Part V');
    }

    return {
      isValid: errors.length === 0,
      errors,
      lawSections,
    };
  }

  /**
   * Validate executor qualifications under Sections 56-66
   */
  private validateExecutorQualification(body: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
    lawSections: string[];
  } {
    const errors: string[] = [];
    const lawSections: string[] = ['Sections 56-66'];

    // Executor must be competent
    if (body.executorIsMinor === true) {
      errors.push('Executor must be at least 18 years old');
    }

    // Executor must not be disqualified
    if (body.executorIsDisqualified === true) {
      errors.push('Executor is disqualified from acting');
    }

    return {
      isValid: errors.length === 0,
      errors,
      lawSections,
    };
  }

  /**
   * Validate minor guardianship provisions
   */
  private validateMinorGuardianship(body: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
    lawSections: string[];
  } {
    const errors: string[] = [];
    const lawSections: string[] = ['Guardianship provisions'];

    // Minors must have appointed guardians
    const hasMinorBeneficiaries = body.hasMinorBeneficiaries === true;
    const hasAppointedGuardians = body.hasAppointedGuardians === true;

    if (hasMinorBeneficiaries && !hasAppointedGuardians) {
      errors.push('Minor beneficiaries must have appointed guardians');
    }

    return {
      isValid: errors.length === 0,
      errors,
      lawSections,
    };
  }

  /**
   * Utility method to extract number from unknown type
   */
  private extractNumber(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  /**
   * Utility method to extract array from unknown type
   */
  private extractArray(value: unknown): unknown[] | null {
    if (Array.isArray(value)) {
      return value as unknown[];
    }
    return null;
  }
}
