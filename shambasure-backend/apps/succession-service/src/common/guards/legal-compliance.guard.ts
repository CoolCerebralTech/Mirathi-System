import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  KENYAN_LAW_METADATA,
  KenyanLawValidationOptions,
} from '../decorators/kenyan-law-validation.decorator';

@Injectable()
export class KenyanLawValidationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<KenyanLawValidationOptions>(
      KENYAN_LAW_METADATA,
      context.getHandler(),
    );

    if (!options) {
      return true; // No Kenyan law validation required
    }

    const request = context.switchToHttp().getRequest();
    const body = request.body;

    // Validate Kenyan law requirements
    const violations = await this.validateKenyanLaw(body, options);

    if (violations.length > 0) {
      throw new BadRequestException({
        message: 'Kenyan law validation failed',
        section: options.section,
        requirement: options.requirement,
        violations,
      });
    }

    return true;
  }

  private async validateKenyanLaw(
    body: any,
    options: KenyanLawValidationOptions,
  ): Promise<string[]> {
    const violations: string[] = [];

    // Validate minimum witnesses (Law of Succession Act Section 11)
    if (options.minWitnesses && body.witnesses && body.witnesses.length < options.minWitnesses) {
      violations.push(`Minimum ${options.minWitnesses} witnesses required by Kenyan law`);
    }

    // Validate dependant provision (Section 26-29)
    if (options.dependantProvision && body.beneficiaries) {
      const hasDependantProvision = this.checkDependantProvision(body.beneficiaries);
      if (!hasDependantProvision) {
        violations.push('Reasonable provision for dependants (spouse/children) required');
      }
    }

    // Validate asset limits
    if (options.maxAssets && body.assets && body.assets.length > options.maxAssets) {
      violations.push(`Maximum ${options.maxAssets} assets allowed`);
    }

    return violations;
  }

  private checkDependantProvision(beneficiaries: any[]): boolean {
    // Check if spouse and children are provided for
    const hasSpouse = beneficiaries.some((b) => b.relationship === 'SPOUSE');
    const hasChildren = beneficiaries.some((b) =>
      ['CHILD', 'ADOPTED_CHILD', 'STEPCHILD'].includes(b.relationship),
    );

    return hasSpouse && hasChildren;
  }
}
