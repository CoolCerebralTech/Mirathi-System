// application/guardianship/commands/handlers/base.command-handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventBus, ICommand } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import { Result } from '../../../common/base/result';

/**
 * Base class for all command handlers.
 * DOES NOT implement ICommandHandler (TS limitation).
 */
@Injectable()
export abstract class BaseCommandHandler<TCommand extends ICommand, TResult = void> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly commandBus: CommandBus,
    protected readonly eventBus: EventBus,
  ) {}

  abstract execute(command: TCommand): Promise<TResult>;

  protected validateCommand(command: TCommand): Result<void> {
    if (!command) {
      return Result.fail(new Error('Command is required'));
    }
    return Result.ok();
  }

  protected async publishDomainEvents(aggregate: {
    getDomainEvents(): readonly any[];
    clearDomainEvents(): void;
  }): Promise<void> {
    const events = aggregate.getDomainEvents();

    for (const event of events) {
      await this.eventBus.publish(event);
    }

    aggregate.clearDomainEvents();
  }

  protected logSuccess(command: TCommand, result?: TResult, context?: string): void {
    this.logger.log({
      message: 'Command executed successfully',
      command: command?.constructor?.name,
      correlationId: (command as any)?.correlationId,
      context,
      resultType: result?.constructor?.name,
    });
  }

  protected logWarning(command: TCommand, warning: string, context?: string): void {
    this.logger.warn({
      message: warning,
      command: command?.constructor?.name,
      correlationId: (command as any)?.correlationId,
      context,
    });
  }

  protected logKenyanLawCompliance(guardianship: GuardianshipAggregate, context: string): void {
    const complianceData = {
      guardianshipId: guardianship.id,
      wardId: guardianship.wardId,
      guardianId: guardianship.guardianId,
      s72Compliant: guardianship.s72ComplianceStatus === 'COMPLIANT',
      s73Compliant: guardianship.s73ComplianceStatus === 'COMPLIANT',
      overallCompliant: guardianship.isCompliantWithKenyanLaw,
      context,
    };

    if (!guardianship.isCompliantWithKenyanLaw) {
      this.logger.warn({
        message: 'Kenyan law compliance issue detected',
        ...complianceData,
        issues: this.extractComplianceIssues(guardianship),
      });
    } else {
      this.logger.log({
        message: 'Kenyan law compliance verified',
        ...complianceData,
      });
    }
  }

  protected extractComplianceIssues(guardianship: GuardianshipAggregate): string[] {
    const issues: string[] = [];

    if (guardianship.s72ComplianceStatus === 'NON_COMPLIANT') {
      issues.push('S.72 Bond Compliance Issue');
    }

    if (guardianship.s73ComplianceStatus === 'NON_COMPLIANT') {
      issues.push('S.73 Annual Report Compliance Issue');
    }

    if (guardianship.isReportOverdue) {
      issues.push('Annual Report Overdue');
    }

    if (guardianship.isBondExpired) {
      issues.push('Bond Expired');
    }

    if (guardianship.isTermExpired) {
      issues.push('Guardianship Term Expired');
    }

    return issues;
  }

  protected validateCourtOrder(courtOrderNumber: string): { isValid: boolean; reason?: string } {
    // Kenyan court order validation logic
    if (!courtOrderNumber) {
      return { isValid: false, reason: 'Court order number is required' };
    }

    // Basic validation for Kenyan court order format
    const validPrefixes = ['HC/', 'MC/', 'PMA/', 'CM/', 'ELC/'];
    const hasValidPrefix = validPrefixes.some((prefix) => courtOrderNumber.startsWith(prefix));

    if (!hasValidPrefix) {
      return {
        isValid: false,
        reason: `Invalid court order format. Must start with one of: ${validPrefixes.join(', ')}`,
      };
    }

    return { isValid: true };
  }

  protected validateBondDetails(bondAmountKES?: number): { isValid: boolean; reason?: string } {
    if (bondAmountKES !== undefined && bondAmountKES < 100000) {
      return {
        isValid: false,
        reason: 'Bond amount must be at least KES 100,000 as per Kenyan law minimum requirements',
      };
    }

    return { isValid: true };
  }

  protected validateAnnualAllowance(
    allowanceAmount: number,
    wardAge?: number,
  ): { isValid: boolean; reason?: string } {
    // Kenyan minimum wage considerations
    const MINIMUM_ALLOWANCE = 120000; // KES per year (KES 10,000 per month)

    if (allowanceAmount < MINIMUM_ALLOWANCE) {
      return {
        isValid: false,
        reason: `Annual allowance must be at least KES ${MINIMUM_ALLOWANCE} (KES 10,000 per month)`,
      };
    }

    // Additional allowances for special needs
    if (wardAge && wardAge < 18 && allowanceAmount > 1000000) {
      return {
        isValid: false,
        reason: 'Annual allowance for minor ward exceeds reasonable limits',
      };
    }

    return { isValid: true };
  }

  protected handleError(error: unknown, command: TCommand, context?: string): never {
    const err = error instanceof Error ? error : new Error(String(error));

    this.logger.error({
      message: 'Command execution failed',
      error: err.message,
      command: command?.constructor?.name,
      correlationId: (command as any)?.correlationId,
      context,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof DomainException) {
      throw error;
    }

    throw new DomainException(err.message, 'COMMAND_EXECUTION_ERROR', {
      command: command?.constructor?.name,
      correlationId: (command as any)?.correlationId,
      context,
    });
  }
}
