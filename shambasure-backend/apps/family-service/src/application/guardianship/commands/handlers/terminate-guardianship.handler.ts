// application/guardianship/commands/handlers/terminate-guardianship.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ICommandHandler } from '@nestjs/cqrs/dist/interfaces/commands/command-handler.interface';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { InvalidGuardianshipException } from '../../../../domain/exceptions/guardianship.exception';
import { IGuardianRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/base/result';
import { GuardianshipResponse } from '../../dto/response/guardianship.response';
import { TerminateGuardianshipCommand } from '../impl/terminate-guardianship.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
export class TerminateGuardianshipHandler
  extends BaseCommandHandler<TerminateGuardianshipCommand, Result<GuardianshipResponse>>
  implements ICommandHandler<TerminateGuardianshipCommand, Result<GuardianshipResponse>>
{
  constructor(
    commandBus: CommandBus,
    eventBus: EventBus,
    private readonly guardianRepository: IGuardianRepository,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: TerminateGuardianshipCommand): Promise<Result<GuardianshipResponse>> {
    try {
      // 1. Validate command
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // 2. Load guardianship
      const guardianship = await this.guardianRepository.findById(command.guardianshipId);
      if (!guardianship) {
        throw new InvalidGuardianshipException(
          `Guardianship with ID ${command.guardianshipId} not found`,
        );
      }

      // 3. Convert to aggregate
      const aggregate = GuardianshipAggregate.createFromProps(guardianship.toJSON());

      // 4. Validate termination requirements
      this.validateTerminationRequirements(aggregate, command);

      // 5. Terminate guardianship
      aggregate.terminate(command.reason, command.terminationDate);

      // 6. Save to repository
      const updatedGuardianship = await this.guardianRepository.update(aggregate);

      // 7. Publish domain events
      await this.publishDomainEvents(updatedGuardianship);

      // 8. Log termination
      this.logTerminationSuccess(command, updatedGuardianship);

      // 9. Return result
      const response = this.mapToResponse(updatedGuardianship);
      return Result.ok(response);
    } catch (error) {
      return this.handleErrorResult(error, command);
    }
  }

  private validateTerminationRequirements(
    aggregate: GuardianshipAggregate,
    command: TerminateGuardianshipCommand,
  ): void {
    // Already terminated check
    if (!aggregate.isActive) {
      throw new InvalidGuardianshipException('Guardianship is already terminated');
    }

    // Termination date validation
    if (command.terminationDate > new Date()) {
      throw new InvalidGuardianshipException('Termination date cannot be in the future');
    }

    if (command.terminationDate < aggregate.appointmentDate) {
      throw new InvalidGuardianshipException('Termination date must be after appointment date');
    }

    // Reason validation
    if (!command.reason || command.reason.trim() === '') {
      throw new InvalidGuardianshipException('Termination reason is required');
    }

    // Court order validation for certain reasons
    const reasonsRequiringCourtOrder = [
      'COURT_ORDER',
      'COURT_REVOCATION',
      'GUARDIAN_INCAPACITATED',
    ];

    if (
      reasonsRequiringCourtOrder.includes(command.reason) &&
      (!command.courtOrderNumber || command.courtOrderNumber.trim() === '')
    ) {
      throw new InvalidGuardianshipException(
        `Court order number is required for termination reason: ${command.reason}`,
      );
    }

    // Final account validation
    if (command.finalAccountBalanceKES !== undefined && command.finalAccountBalanceKES < 0) {
      throw new InvalidGuardianshipException('Final account balance cannot be negative');
    }

    // New guardian validation if transferring
    if (command.newGuardianId && command.newGuardianId === aggregate.guardianId) {
      throw new InvalidGuardianshipException('Cannot transfer guardianship to the same guardian');
    }
  }

  private logTerminationSuccess(
    command: TerminateGuardianshipCommand,
    guardianship: GuardianshipAggregate,
  ): void {
    this.logger.log({
      message: 'Guardianship terminated successfully',
      guardianshipId: guardianship.id,
      wardId: guardianship.wardId,
      guardianId: guardianship.guardianId,
      terminationReason: command.reason,
      terminationDate: command.terminationDate,
      correlationId: command.correlationId,
      finalComplianceStatus: guardianship.isCompliantWithKenyanLaw,
      timestamp: new Date().toISOString(),
    });

    // Log if there were compliance issues at termination
    if (!guardianship.isCompliantWithKenyanLaw) {
      const issues = this.extractComplianceIssues(guardianship);
      this.logger.warn({
        message: 'Guardianship terminated with compliance issues',
        guardianshipId: guardianship.id,
        issues,
        correlationId: command.correlationId,
      });
    }
  }

  private mapToResponse(guardianship: GuardianshipAggregate): GuardianshipResponse {
    return {
      id: guardianship.id,
      wardId: guardianship.wardId,
      guardianId: guardianship.guardianId,
      type: guardianship.type,
      courtOrderNumber: guardianship.courtOrderNumber,
      courtStation: guardianship.courtStation,
      appointmentDate: guardianship.appointmentDate,
      validUntil: guardianship.validUntil,
      hasPropertyManagementPowers: guardianship.hasPropertyManagementPowers,
      canConsentToMedical: guardianship.canConsentToMedical,
      canConsentToMarriage: guardianship.canConsentToMarriage,
      restrictions: guardianship.restrictions,
      specialInstructions: guardianship.specialInstructions,
      bondRequired: guardianship.bondRequired,
      bondAmountKES: guardianship.bondAmountKES,
      bondProvider: guardianship.bondProvider,
      bondPolicyNumber: guardianship.bondPolicyNumber,
      bondExpiry: guardianship.bondExpiry,
      annualAllowanceKES: guardianship.annualAllowanceKES,
      lastReportDate: guardianship.lastReportDate,
      nextReportDue: guardianship.nextReportDue,
      reportStatus: guardianship.reportStatus,
      isActive: guardianship.isActive,
      terminationDate: guardianship.terminationDate,
      terminationReason: guardianship.terminationReason,
      isBondPosted: guardianship.isBondPosted,
      isBondExpired: guardianship.isBondExpired,
      isReportOverdue: guardianship.isReportOverdue,
      isTermExpired: guardianship.isTermExpired,
      s73ComplianceStatus: guardianship.s73ComplianceStatus,
      s72ComplianceStatus: guardianship.s72ComplianceStatus,
      isCompliantWithKenyanLaw: guardianship.isCompliantWithKenyanLaw,
      version: guardianship.version,
      createdAt: guardianship.createdAt,
      updatedAt: guardianship.updatedAt,
    };
  }

  private handleErrorResult(
    error: unknown,
    command: TerminateGuardianshipCommand,
  ): Result<GuardianshipResponse> {
    if (error instanceof InvalidGuardianshipException) {
      return Result.fail(error);
    }
    this.handleError(error, command, 'TerminateGuardianshipHandler');
    return Result.fail(new Error('Failed to terminate guardianship'));
  }
}
