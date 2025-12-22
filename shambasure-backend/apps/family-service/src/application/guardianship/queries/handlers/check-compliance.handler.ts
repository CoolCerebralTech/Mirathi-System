// application/guardianship/queries/handlers/check-compliance.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { InvalidGuardianshipException } from '../../../../domain/exceptions/guardianship.exception';
import type { IGuardianRepository } from '../../../../domain/interfaces/repositories/iguardian.repository';
import { Result } from '../../../common/base/result';
import { CheckComplianceQuery } from '../impl/check-compliance.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(CheckComplianceQuery)
export class CheckComplianceHandler
  extends BaseQueryHandler<CheckComplianceQuery, Result<any>>
  implements IQueryHandler<CheckComplianceQuery, Result<any>>
{
  constructor(private readonly guardianRepository: IGuardianRepository) {
    super();
  }

  async execute(query: CheckComplianceQuery): Promise<Result<any>> {
    try {
      // 1. Log query execution
      this.logQueryExecution(query, 'CheckCompliance');

      // 2. Validate query
      const validation = this.validateQuery(query);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // 3. Load guardianship
      const guardian = await this.guardianRepository.findById(query.guardianshipId);
      if (!guardian) {
        return Result.fail(
          new InvalidGuardianshipException(
            `Guardianship with ID ${query.guardianshipId} not found`,
          ),
        );
      }

      // 4. Convert to aggregate
      const aggregate = GuardianshipAggregate.createFromProps(guardian.toJSON());

      // 5. Check compliance based on query parameters
      const complianceCheck = this.performComplianceCheck(aggregate, query);

      // 6. Log compliance check
      this.logComplianceCheck(aggregate.id, complianceCheck, 'CheckCompliance');

      // 7. Build response
      const response = this.buildComplianceResponse(aggregate, complianceCheck, query);

      // 8. Log success
      this.logQuerySuccess(query, 1, 'CheckCompliance');

      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'CheckComplianceHandler');
      return Result.fail(new Error('Failed to check compliance'));
    }
  }

  private performComplianceCheck(
    aggregate: GuardianshipAggregate,
    query: CheckComplianceQuery,
  ): {
    s72Compliant: boolean;
    s73Compliant: boolean;
    overallCompliant: boolean;
    issues: string[];
    recommendations: string[];
    legalRequirements: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const legalRequirements: string[] = [];

    // Determine what to check based on query
    const checkAll = !query.checkBondOnly && !query.checkReportOnly;
    const checkS72 = query.checkBondOnly || checkAll;
    const checkS73 = query.checkReportOnly || checkAll;

    // Section 72: Guardian Bond Compliance
    if (checkS72) {
      legalRequirements.push('Section 72 LSA: Guardian must post bond for property management');

      if (aggregate.bondRequired) {
        if (!aggregate.isBondPosted) {
          issues.push('S.72 LSA: Bond required but not posted');
          recommendations.push('Post bond with approved insurance provider within 14 days');
        } else if (aggregate.isBondExpired) {
          issues.push('S.72 LSA: Bond has expired');
          recommendations.push('Renew bond immediately to maintain legal protection');
        } else {
          // Check bond adequacy
          const bondAdequacy = this.checkBondAdequacy(aggregate);
          if (!bondAdequacy.isAdequate) {
            issues.push(`S.72 LSA: Bond may be inadequate: ${bondAdequacy.reason}`);
            recommendations.push(
              'Consider increasing bond amount or obtaining additional security',
            );
          }
        }
      } else if (aggregate.hasPropertyManagementPowers) {
        issues.push('S.72 LSA: Property management powers require bond');
        recommendations.push('Court must order bond requirement for property management');
      }
    }

    // Section 73: Annual Reporting Compliance
    if (checkS73) {
      legalRequirements.push('Section 73 LSA: Annual accounting to court for property guardians');

      if (aggregate.hasPropertyManagementPowers && aggregate.isActive) {
        if (aggregate.isReportOverdue) {
          issues.push('S.73 LSA: Annual report overdue');
          recommendations.push('File annual report immediately to avoid court sanctions');
        } else if (!aggregate.lastReportDate) {
          issues.push('S.73 LSA: No annual report filed yet');
          recommendations.push('First annual report due 1 year after appointment');
        } else {
          const reportCompliance = this.checkReportCompliance(aggregate);
          if (!reportCompliance.isCompliant) {
            issues.push(`S.73 LSA: Report compliance issues: ${reportCompliance.reason}`);
            recommendations.push(reportCompliance.recommendation);
          }
        }
      } else if (aggregate.isActive && !aggregate.hasPropertyManagementPowers) {
        legalRequirements.push('Annual reporting not required (no property management powers)');
      }
    }

    // Additional compliance checks
    if (checkAll) {
      // Guardian eligibility
      const guardianEligibility = this.checkGuardianEligibility(aggregate);
      if (!guardianEligibility.isEligible) {
        issues.push(`Guardian eligibility: ${guardianEligibility.reason}`);
        recommendations.push(guardianEligibility.recommendation);
      }

      // Term compliance
      if (aggregate.isTermExpired) {
        issues.push('Guardianship term has expired');
        recommendations.push('Apply for term extension or terminate guardianship');
      }

      // Allowance compliance
      if (aggregate.annualAllowanceKES) {
        const allowanceCompliance = this.checkAllowanceCompliance(aggregate);
        if (!allowanceCompliance.isCompliant) {
          issues.push(`Allowance compliance: ${allowanceCompliance.reason}`);
          recommendations.push(allowanceCompliance.recommendation);
        }
      }
    }

    return {
      s72Compliant: aggregate.s72ComplianceStatus === 'COMPLIANT',
      s73Compliant: aggregate.s73ComplianceStatus === 'COMPLIANT',
      overallCompliant: aggregate.isCompliantWithKenyanLaw,
      issues: query.includeDetails ? issues : [],
      recommendations: query.includeRecommendations ? recommendations : [],
      legalRequirements: query.includeDetails ? legalRequirements : [],
    };
  }

  private checkBondAdequacy(aggregate: GuardianshipAggregate): {
    isAdequate: boolean;
    reason?: string;
  } {
    // Simplified bond adequacy check
    // In reality, this would consider estate value, property types, etc.
    if (!aggregate.bondAmountKES) {
      return { isAdequate: false, reason: 'Bond amount not specified' };
    }

    const MINIMUM_BOND = 100000; // KES 100,000 minimum
    if (aggregate.bondAmountKES < MINIMUM_BOND) {
      return {
        isAdequate: false,
        reason: `Bond amount (KES ${aggregate.bondAmountKES}) below minimum (KES ${MINIMUM_BOND})`,
      };
    }

    // Check if bond covers at least 10% of estimated property value
    // This is a placeholder - actual logic would use property valuation
    const estimatedPropertyValue = 0; // Would come from estate service
    if (estimatedPropertyValue > 0 && aggregate.bondAmountKES < estimatedPropertyValue * 0.1) {
      return {
        isAdequate: false,
        reason: 'Bond may not adequately secure property value',
      };
    }

    return { isAdequate: true };
  }

  private checkReportCompliance(aggregate: GuardianshipAggregate): {
    isCompliant: boolean;
    reason?: string;
    recommendation?: string;
  } {
    if (!aggregate.lastReportDate || !aggregate.nextReportDue) {
      return {
        isCompliant: false,
        reason: 'Incomplete reporting schedule',
        recommendation: 'Establish clear reporting timeline',
      };
    }

    // Check if reports are filed on time (within 30 days of due date)
    const lastReportDelay = this.calculateDaysBetween(
      aggregate.lastReportDate,
      aggregate.appointmentDate,
    );
    const expectedReportDate = 365; // 1 year

    if (lastReportDelay > expectedReportDate + 30) {
      return {
        isCompliant: false,
        reason: `Last report filed ${lastReportDelay - expectedReportDate} days late`,
        recommendation: 'Implement stricter reporting deadlines',
      };
    }

    return { isCompliant: true };
  }

  private checkGuardianEligibility(aggregate: GuardianshipAggregate): {
    isEligible: boolean;
    reason?: string;
    recommendation?: string;
  } {
    // Basic eligibility checks
    // In reality, would check against Kenyan Guardianship Act requirements

    if (aggregate.type === 'COURT_APPOINTED' && !aggregate.courtOrderNumber) {
      return {
        isEligible: false,
        reason: 'Court-appointed guardian missing court order',
        recommendation: 'Provide valid court order number',
      };
    }

    if (
      aggregate.bondRequired &&
      aggregate.hasPropertyManagementPowers &&
      !aggregate.isBondPosted
    ) {
      return {
        isEligible: false,
        reason: 'Property management requires posted bond',
        recommendation: 'Post bond before exercising property powers',
      };
    }

    return { isEligible: true };
  }

  private checkAllowanceCompliance(aggregate: GuardianshipAggregate): {
    isCompliant: boolean;
    reason?: string;
    recommendation?: string;
  } {
    if (!aggregate.annualAllowanceKES) {
      return { isCompliant: true }; // No allowance set
    }

    // Check if allowance is reasonable
    const MAX_REASONABLE_ALLOWANCE = 1000000; // KES 1,000,000 per year
    if (aggregate.annualAllowanceKES > MAX_REASONABLE_ALLOWANCE) {
      return {
        isCompliant: false,
        reason: `Allowance (KES ${aggregate.annualAllowanceKES}) exceeds reasonable limits`,
        recommendation: 'Court may require justification for high allowance',
      };
    }

    // Check if allowance approved (if required)
    if (aggregate.annualAllowanceKES > 240000 && !aggregate.allowanceApprovedBy) {
      // KES 20,000 per month threshold
      return {
        isCompliant: false,
        reason: 'Allowance above threshold requires court approval',
        recommendation: 'Obtain court approval for allowance amount',
      };
    }

    return { isCompliant: true };
  }

  private buildComplianceResponse(
    aggregate: GuardianshipAggregate,
    complianceCheck: any,
    query: CheckComplianceQuery,
  ): any {
    const baseResponse = {
      guardianshipId: aggregate.id,
      wardId: aggregate.wardId,
      guardianId: aggregate.guardianId,
      checkDate: new Date(),
      checksPerformed: {
        s72BondCompliance: query.checkBondOnly || (!query.checkReportOnly && !query.checkBondOnly),
        s73ReportCompliance:
          query.checkReportOnly || (!query.checkReportOnly && !query.checkBondOnly),
        overallCompliance: !query.checkReportOnly && !query.checkBondOnly,
      },
      ...complianceCheck,
    };

    // Add historical data if requested
    if (query.includeHistory) {
      baseResponse.complianceHistory = this.generateComplianceHistory(aggregate);
    }

    // Add risk assessment
    baseResponse.riskAssessment = this.assessComplianceRisk(complianceCheck);

    return baseResponse;
  }

  private generateComplianceHistory(aggregate: GuardianshipAggregate): any[] {
    // Placeholder for compliance history
    // In reality, would fetch from audit logs or compliance tracking
    return [
      {
        date: aggregate.createdAt,
        event: 'Guardianship created',
        status: 'INITIAL',
      },
      {
        date: aggregate.updatedAt,
        event: 'Last updated',
        status: aggregate.isCompliantWithKenyanLaw ? 'COMPLIANT' : 'NON_COMPLIANT',
      },
    ];
  }

  private assessComplianceRisk(complianceCheck: any): {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    actionsRequired: string[];
  } {
    const factors: string[] = [];
    const actionsRequired: string[] = [];

    // Assess risk based on issues
    let riskScore = 0;

    if (!complianceCheck.s72Compliant) riskScore += 2;
    if (!complianceCheck.s73Compliant) riskScore += 2;
    if (complianceCheck.issues && complianceCheck.issues.length > 0) {
      riskScore += complianceCheck.issues.length;
      factors.push(...complianceCheck.issues);
    }
    if (complianceCheck.recommendations && complianceCheck.recommendations.length > 0) {
      actionsRequired.push(...complianceCheck.recommendations);
    }

    // Determine risk level
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore === 0) {
      level = 'LOW';
    } else if (riskScore <= 2) {
      level = 'MEDIUM';
    } else if (riskScore <= 4) {
      level = 'HIGH';
    } else {
      level = 'CRITICAL';
    }

    return { level, factors, actionsRequired };
  }

  private calculateDaysBetween(date1: Date, date2: Date): number {
    const diff = Math.abs(new Date(date1).getTime() - new Date(date2).getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
