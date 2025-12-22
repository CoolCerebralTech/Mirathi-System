// application/guardianship/commands/handlers/file-annual-report.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ICommandHandler } from '@nestjs/cqrs/dist/interfaces/commands/command-handler.interface';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { InvalidGuardianshipException } from '../../../../domain/exceptions/guardianship.exception';
import type { IGuardianRepository } from '../../../../domain/interfaces/repositories/iguardian.repository';
import { Result } from '../../../common/base/result';
import { GuardianshipResponse } from '../../dto/response/guardianship.response';
import { FileAnnualReportCommand } from '../impl/file-annual-report.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
export class FileAnnualReportHandler
  extends BaseCommandHandler<FileAnnualReportCommand, Result<GuardianshipResponse>>
  implements ICommandHandler<FileAnnualReportCommand, Result<GuardianshipResponse>>
{
  constructor(
    commandBus: CommandBus,
    eventBus: EventBus,
    private readonly guardianRepository: IGuardianRepository,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: FileAnnualReportCommand): Promise<Result<GuardianshipResponse>> {
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

      // 4. Validate annual report requirements (S.73 LSA)
      this.validateAnnualReportRequirements(aggregate, command);

      // 5. File annual report
      aggregate.fileAnnualReport(command.reportDate, command.summary, command.approvedBy);

      // 6. Save to repository
      const updatedGuardianship = await this.guardianRepository.update(aggregate);

      // 7. Publish domain events
      await this.publishDomainEvents(updatedGuardianship);

      // 8. Log success and compliance
      this.logSuccess(command);
      this.logKenyanLawCompliance(updatedGuardianship, 'FILE_ANNUAL_REPORT');

      // 9. Return result
      const response = this.mapToResponse(updatedGuardianship);
      return Result.ok(response);
    } catch (error) {
      return this.handleErrorResult(error, command);
    }
  }

  private validateAnnualReportRequirements(
    aggregate: GuardianshipAggregate,
    command: FileAnnualReportCommand,
  ): void {
    // S.73 LSA Compliance checks

    // Must be active
    if (!aggregate.isActive) {
      throw new InvalidGuardianshipException('Cannot file report for inactive guardianship');
    }

    // Report date validation
    if (command.reportDate > new Date()) {
      throw new InvalidGuardianshipException('Report date cannot be in the future');
    }

    // Check if report is due
    if (aggregate.nextReportDue && command.reportDate < aggregate.nextReportDue) {
      this.logWarning(
        command,
        `Filing report before due date. Next report was due: ${aggregate.nextReportDue}`,
      );
    }

    // Validate summary length and content
    if (!command.summary || command.summary.trim().length < 50) {
      throw new InvalidGuardianshipException(
        'Report summary must be at least 50 characters describing activities and expenses',
      );
    }

    // Validate expenses if provided
    if (command.expensesKES !== undefined && command.expensesKES < 0) {
      throw new InvalidGuardianshipException('Expenses cannot be negative');
    }

    // Validate income if provided
    if (command.incomeKES !== undefined && command.incomeKES < 0) {
      throw new InvalidGuardianshipException('Income cannot be negative');
    }

    // Validate financial consistency
    if (command.expensesKES && command.incomeKES && command.expensesKES > command.incomeKES * 2) {
      this.logWarning(
        command,
        'Expenses significantly exceed income. This may require court explanation.',
      );
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
    command: FileAnnualReportCommand,
  ): Result<GuardianshipResponse> {
    if (error instanceof InvalidGuardianshipException) {
      return Result.fail(error);
    }
    this.handleError(error, command, 'FileAnnualReportHandler');
    return Result.fail(new Error('Failed to file annual report'));
  }
}
