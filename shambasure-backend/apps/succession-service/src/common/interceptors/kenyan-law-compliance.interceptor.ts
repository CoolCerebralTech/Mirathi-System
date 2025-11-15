import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SUCCESSION_COMPLIANCE_METADATA } from '../decorators/succession-compliance.decorator';

interface ComplianceOptions {
  complianceCheck:
    | 'intestate-distribution'
    | 'probate-requirements'
    | 'dependant-provision'
    | 'will-execution';
}

interface DistributionData {
  distribution?: {
    spouse?: { share: number };
    children?: Array<{ share: number }>;
    otherHeirs?: unknown;
  };
  probateCase?: {
    applicationDate: string;
    deceasedDate: string;
    applicants?: unknown[];
  };
  will?: {
    witnesses?: unknown[];
    executors?: Array<{ status: string }>;
  };
  beneficiaries?: Array<{ relationship: string }>;
}

@Injectable()
export class KenyanLawComplianceInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const complianceOptions = this.reflector.get<ComplianceOptions | undefined>(
      SUCCESSION_COMPLIANCE_METADATA,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap((data: unknown) => {
        if (complianceOptions) {
          this.applyComplianceChecks(data, complianceOptions, context);
        }

        // Always apply basic Kenyan law compliance
        this.applyBasicKenyanCompliance(data);
      }),
    );
  }

  private applyComplianceChecks(
    data: unknown,
    options: ComplianceOptions,
    context: ExecutionContext,
  ): void {
    const request = context.switchToHttp().getRequest();

    switch (options.complianceCheck) {
      case 'intestate-distribution':
        this.validateIntestateDistribution(data, request);
        break;
      case 'probate-requirements':
        this.validateProbateRequirements(data, request);
        break;
      case 'dependant-provision':
        this.validateDependantProvision(data, request);
        break;
      case 'will-execution':
        this.validateWillExecution(data, request);
        break;
    }
  }

  private validateIntestateDistribution(data: unknown, request: unknown): void {
    const distributionData = data as DistributionData;
    // Law of Succession Act Section 35-41
    if (distributionData.distribution) {
      const { spouse, children, otherHeirs } = distributionData.distribution;

      // Ensure spouse gets personal and household effects
      if (!spouse || spouse.share < 0.1) {
        console.warn(
          'Intestate distribution may not comply with Section 35: Spouse share insufficient',
        );
      }

      // Ensure children get remainder
      if (
        children &&
        children.length > 0 &&
        children.reduce((sum, child) => sum + child.share, 0) < 0.9
      ) {
        console.warn(
          'Intestate distribution may not comply with Section 35: Children share insufficient',
        );
      }
    }
  }

  private validateProbateRequirements(data: unknown, request: unknown): void {
    const probateData = data as DistributionData;
    // Law of Succession Act Section 51-66
    if (probateData.probateCase) {
      const { applicationDate, deceasedDate, applicants } = probateData.probateCase;

      // Check 6-month timeframe
      const applicationDeadline = new Date(deceasedDate);
      applicationDeadline.setMonth(applicationDeadline.getMonth() + 6);

      if (new Date(applicationDate) > applicationDeadline) {
        console.warn('Probate application filed after 6-month deadline (Section 51)');
      }

      // Validate applicants
      if (!applicants || applicants.length === 0) {
        console.warn('Probate application requires at least one applicant (Section 55)');
      }
    }
  }

  private validateDependantProvision(data: unknown, request: unknown): void {
    const dependantData = data as DistributionData;
    // Law of Succession Act Section 26-29
    if (dependantData.will && dependantData.beneficiaries) {
      const dependants = dependantData.beneficiaries.filter((b) =>
        ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(b.relationship),
      );

      if (dependants.length === 0) {
        console.warn('Will may not provide reasonable provision for dependants (Section 26)');
      }
    }
  }

  private validateWillExecution(data: unknown, request: unknown): void {
    const willData = data as DistributionData;
    // Law of Succession Act Section 71-84
    if (willData.will && willData.executors) {
      const activeExecutors = willData.executors.filter((e) => e.status === 'ACTIVE');

      if (activeExecutors.length === 0) {
        console.warn('Will execution requires at least one active executor (Section 71)');
      }
    }
  }

  private applyBasicKenyanCompliance(data: unknown): void {
    const basicData = data as DistributionData;
    // Always check for basic Kenyan law compliance
    if (basicData.will) {
      // Check will formalities
      if (!basicData.will.witnesses || basicData.will.witnesses.length < 2) {
        console.warn('Will may not meet Kenyan witness requirements (Section 11)');
      }
    }
  }
}
