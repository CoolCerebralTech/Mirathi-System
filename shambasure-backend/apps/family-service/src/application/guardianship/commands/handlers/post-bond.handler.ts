// application/guardianship/commands/handlers/post-bond.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ICommandHandler } from '@nestjs/cqrs/dist/interfaces/commands/command-handler.interface';

import { InvalidGuardianshipException } from '../../../../domain/exceptions/guardianship.exception';
import type { IGuardianRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/base/result';
import { GuardianshipResponse } from '../../dto/response/guardianship.response';
import { PostBondCommand } from '../impl/post-bond.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
export class PostBondHandler
  extends BaseCommandHandler<PostBondCommand, Result<GuardianshipResponse>>
  implements ICommandHandler<PostBondCommand, Result<GuardianshipResponse>>
{
  constructor(
    commandBus: CommandBus,
    eventBus: EventBus,
    private readonly guardianRepository: IGuardianRepository,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: PostBondCommand): Promise<Result<GuardianshipResponse>> {
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

      // 4. Validate bond posting requirements (S.72 LSA)
      this.validateBondPostingRequirements(aggregate, command);

      // 5. Post bond
      aggregate.postBond({
        provider: command.provider,
        policyNumber: command.policyNumber,
        expiryDate: command.expiryDate,
      });

      // 6. Save to repository
      const updatedGuardianship = await this.guardianRepository.update(aggregate);

      // 7. Publish domain events
      await this.publishDomainEvents(updatedGuardianship);

      // 8. Log success and compliance
      this.logSuccess(command);
      this.logKenyanLawCompliance(updatedGuardianship, 'POST_BOND');

      // 9. Return result
      const response = this.mapToResponse(updatedGuardianship);
      return Result.ok(response);
    } catch (error) {
      return this.handleErrorResult(error, command);
    }
  }

  private validateBondPostingRequirements(
    aggregate: GuardianshipAggregate,
    command: PostBondCommand,
  ): void {
    // S.72 LSA Compliance checks
    if (!aggregate.bondRequired) {
      throw new InvalidGuardianshipException('Bond is not required for this guardianship');
    }

    if (!aggregate.bondAmountKES) {
      throw new InvalidGuardianshipException('Bond amount must be set before posting bond');
    }

    // Validate bond expiry date is in future
    if (command.expiryDate <= new Date()) {
      throw new InvalidGuardianshipException('Bond expiry date must be in the future');
    }

    // Validate bond provider
    if (!command.provider || command.provider.trim() === '') {
      throw new InvalidGuardianshipException('Bond provider is required');
    }

    // Validate policy number
    if (!command.policyNumber || command.policyNumber.trim() === '') {
      throw new InvalidGuardianshipException('Bond policy number is required');
    }

    // Kenyan insurance company validation (simplified)
    const validInsuranceCompanies = [
      'APA INSURANCE',
      'BRITAM',
      'JUBILEE INSURANCE',
      'CFC STANBIC',
      'LIBERTY INSURANCE',
      'KENYA REINSURANCE CORPORATION',
      'UAP INSURANCE',
      'HERITAGE INSURANCE',
    ];

    const providerUpper = command.provider.toUpperCase();
    const isValidProvider = validInsuranceCompanies.some((company) =>
      providerUpper.includes(company),
    );

    if (!isValidProvider) {
      this.logWarning(
        command,
        `Bond provider ${command.provider} is not a recognized Kenyan insurance company`,
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
    command: PostBondCommand,
  ): Result<GuardianshipResponse> {
    if (error instanceof InvalidGuardianshipException) {
      return Result.fail(error);
    }
    this.handleError(error, command, 'PostBondHandler');
    return Result.fail(new Error('Failed to post bond'));
  }
}
