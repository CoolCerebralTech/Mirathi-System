// application/guardianship/commands/handlers/grant-property-powers.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ICommandHandler } from '@nestjs/cqrs/dist/interfaces/commands/command-handler.interface';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { InvalidGuardianshipException } from '../../../../domain/exceptions/guardianship.exception';
import { IGuardianRepository } from '../../../../domain/interfaces/repositories/iguardian.repository';
import { Result } from '../../../common/base/result';
import { GuardianshipResponse } from '../../dto/response/guardianship.response';
import { GrantPropertyManagementPowersCommand } from '../impl/grant-property-powers.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
export class GrantPropertyManagementPowersHandler
  extends BaseCommandHandler<GrantPropertyManagementPowersCommand, Result<GuardianshipResponse>>
  implements ICommandHandler<GrantPropertyManagementPowersCommand, Result<GuardianshipResponse>>
{
  constructor(
    commandBus: CommandBus,
    eventBus: EventBus,
    private readonly guardianRepository: IGuardianRepository,
  ) {
    super(commandBus, eventBus);
  }

  async execute(
    command: GrantPropertyManagementPowersCommand,
  ): Promise<Result<GuardianshipResponse>> {
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

      // 4. Validate property powers requirements (S.72 LSA)
      this.validatePropertyPowersRequirements(aggregate, command);

      // 5. Grant property management powers
      aggregate.grantPropertyManagementPowers(command.courtOrderNumber, command.restrictions);

      // 6. Update bond amount if increased
      if (command.increasedBondAmountKES) {
        // Note: This would need additional logic to handle bond amount updates
        this.logWarning(
          command,
          'Bond amount increase requested. This requires separate bond update process.',
        );
      }

      // 7. Save to repository
      const updatedGuardianship = await this.guardianRepository.update(aggregate);

      // 8. Publish domain events
      await this.publishDomainEvents(updatedGuardianship);

      // 9. Log success and compliance
      this.logSuccess(command);
      this.logKenyanLawCompliance(updatedGuardianship, 'GRANT_PROPERTY_POWERS');

      // 10. Return result
      const response = this.mapToResponse(updatedGuardianship);
      return Result.ok(response);
    } catch (error) {
      return this.handleErrorResult(error, command);
    }
  }

  private validatePropertyPowersRequirements(
    aggregate: GuardianshipAggregate,
    command: GrantPropertyManagementPowersCommand,
  ): void {
    // S.72 LSA Compliance checks for property powers

    // Must be active
    if (!aggregate.isActive) {
      throw new InvalidGuardianshipException('Cannot grant powers to inactive guardianship');
    }

    // Already has property powers check
    if (aggregate.hasPropertyManagementPowers) {
      throw new InvalidGuardianshipException('Guardian already has property management powers');
    }

    // Court order validation (usually required for property powers)
    if (!command.courtOrderNumber || command.courtOrderNumber.trim() === '') {
      throw new InvalidGuardianshipException(
        'Court order number is required for granting property management powers',
      );
    }

    // Validate court order
    const courtValidation = this.validateCourtOrder(command.courtOrderNumber);
    if (!courtValidation.isValid) {
      throw new InvalidGuardianshipException(
        `Invalid court order for property powers: ${courtValidation.reason}`,
      );
    }

    // Bond requirements for property powers
    if (aggregate.bondRequired) {
      if (!aggregate.isBondPosted) {
        throw new InvalidGuardianshipException(
          'Bond must be posted before granting property management powers (S.72 LSA)',
        );
      }

      if (aggregate.isBondExpired) {
        throw new InvalidGuardianshipException(
          'Bond has expired. Renew bond before granting property powers',
        );
      }
    }

    // Restrictions validation
    if (!command.restrictions || typeof command.restrictions !== 'object') {
      throw new InvalidGuardianshipException('Valid restrictions object is required');
    }

    // Validate restrictions contain essential safeguards
    const essentialSafeguards = [
      'requiresFamilyConsent',
      'investmentRestrictions',
      'saleRestrictions',
    ];

    const hasEssentialSafeguards = essentialSafeguards.some(
      (safeguard) => command.restrictions[safeguard] !== undefined,
    );

    if (!hasEssentialSafeguards) {
      this.logWarning(
        command,
        'Property powers granted without essential safeguards. Consider adding: requiresFamilyConsent, investmentRestrictions, saleRestrictions',
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
    command: GrantPropertyManagementPowersCommand,
  ): Result<GuardianshipResponse> {
    if (error instanceof InvalidGuardianshipException) {
      return Result.fail(error);
    }
    this.handleError(error, command, 'GrantPropertyManagementPowersHandler');
    return Result.fail(new Error('Failed to grant property management powers'));
  }
}
