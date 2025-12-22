// application/guardianship/commands/handlers/create-guardianship.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ICommandHandler } from '@nestjs/cqrs/dist/interfaces/commands/command-handler.interface';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { InvalidGuardianshipException } from '../../../../domain/exceptions/guardianship.exception';
import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import type { IGuardianRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/base/result';
import { GuardianshipResponse } from '../../dto/response/guardianship.response';
import { CreateGuardianshipCommand } from '../impl/create-guardianship.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
export class CreateGuardianshipHandler
  extends BaseCommandHandler<CreateGuardianshipCommand, Result<GuardianshipResponse>>
  implements ICommandHandler<CreateGuardianshipCommand, Result<GuardianshipResponse>>
{
  constructor(
    commandBus: CommandBus,
    eventBus: EventBus,
    private readonly guardianRepository: IGuardianRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: CreateGuardianshipCommand): Promise<Result<GuardianshipResponse>> {
    try {
      // 1. Validate command
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // 2. Validate Kenyan law requirements
      this.validateKenyanLawRequirements(command);

      // 3. Check if ward exists and is a minor/dependent
      const ward = await this.familyMemberRepository.findById(command.wardId);
      if (!ward) {
        throw new InvalidGuardianshipException(`Ward with ID ${command.wardId} not found`);
      }

      // 4. Check if guardian exists
      const guardian = await this.familyMemberRepository.findById(command.guardianId);
      if (!guardian) {
        throw new InvalidGuardianshipException(`Guardian with ID ${command.guardianId} not found`);
      }

      // 5. Validate that person isn't their own guardian
      if (command.wardId === command.guardianId) {
        throw new InvalidGuardianshipException('A person cannot be their own guardian');
      }

      // 6. Check for existing active guardianship for this ward
      const existingGuardianship = await this.guardianRepository.findActiveByWardId(command.wardId);
      if (existingGuardianship) {
        throw new InvalidGuardianshipException(
          `Ward ${command.wardId} already has an active guardianship`,
        );
      }

      // 7. Check guardianship uniqueness
      const isUnique = await this.guardianRepository.validateGuardianshipUniqueness(
        command.wardId,
        command.guardianId,
        command.type,
      );
      if (!isUnique) {
        throw new InvalidGuardianshipException('This guardianship arrangement already exists');
      }

      // 8. Create the aggregate
      const guardianship = GuardianshipAggregate.create({
        wardId: command.wardId,
        guardianId: command.guardianId,
        type: command.type,
        appointmentDate: command.appointmentDate,
        courtOrderNumber: command.courtOrderNumber,
        courtStation: command.courtStation,
        validUntil: command.validUntil,
        guardianIdNumber: command.guardianIdNumber,
        courtCaseNumber: command.courtCaseNumber,
        interimOrderId: command.interimOrderId,
        hasPropertyManagementPowers: command.hasPropertyManagementPowers,
        canConsentToMedical: command.canConsentToMedical,
        canConsentToMarriage: command.canConsentToMarriage,
        restrictions: command.restrictions,
        specialInstructions: command.specialInstructions,
        bondRequired: command.bondRequired,
        bondAmountKES: command.bondAmountKES,
        annualAllowanceKES: command.annualAllowanceKES,
      });

      // 9. Save to repository
      const savedGuardianship = await this.guardianRepository.create(guardianship);

      // 10. Publish domain events
      await this.publishDomainEvents(savedGuardianship);

      // 11. Log success and compliance
      this.logSuccess(command);
      this.logKenyanLawCompliance(savedGuardianship, 'CREATE_GUARDIANSHIP');

      // 12. Return result with response DTO
      const response: GuardianshipResponse = {
        id: savedGuardianship.id,
        wardId: savedGuardianship.wardId,
        guardianId: savedGuardianship.guardianId,
        type: savedGuardianship.type,
        courtOrderNumber: savedGuardianship.courtOrderNumber,
        courtStation: savedGuardianship.courtStation,
        appointmentDate: savedGuardianship.appointmentDate,
        validUntil: savedGuardianship.validUntil,
        hasPropertyManagementPowers: savedGuardianship.hasPropertyManagementPowers,
        canConsentToMedical: savedGuardianship.canConsentToMedical,
        canConsentToMarriage: savedGuardianship.canConsentToMarriage,
        restrictions: savedGuardianship.restrictions,
        specialInstructions: savedGuardianship.specialInstructions,
        bondRequired: savedGuardianship.bondRequired,
        bondAmountKES: savedGuardianship.bondAmountKES,
        bondProvider: savedGuardianship.bondProvider,
        bondPolicyNumber: savedGuardianship.bondPolicyNumber,
        bondExpiry: savedGuardianship.bondExpiry,
        annualAllowanceKES: savedGuardianship.annualAllowanceKES,
        lastReportDate: savedGuardianship.lastReportDate,
        nextReportDue: savedGuardianship.nextReportDue,
        reportStatus: savedGuardianship.reportStatus,
        isActive: savedGuardianship.isActive,
        terminationDate: savedGuardianship.terminationDate,
        terminationReason: savedGuardianship.terminationReason,
        isBondPosted: savedGuardianship.isBondPosted,
        isBondExpired: savedGuardianship.isBondExpired,
        isReportOverdue: savedGuardianship.isReportOverdue,
        isTermExpired: savedGuardianship.isTermExpired,
        s73ComplianceStatus: savedGuardianship.s73ComplianceStatus,
        s72ComplianceStatus: savedGuardianship.s72ComplianceStatus,
        isCompliantWithKenyanLaw: savedGuardianship.isCompliantWithKenyanLaw,
        version: savedGuardianship.version,
        createdAt: savedGuardianship.createdAt,
        updatedAt: savedGuardianship.updatedAt,
      };

      return Result.ok(response);
    } catch (error) {
      return this.handleErrorResult(error, command);
    }
  }

  private validateKenyanLawRequirements(command: CreateGuardianshipCommand): void {
    // Court-appointed guardians must have court order
    if (
      command.type === 'COURT_APPOINTED' &&
      (!command.courtOrderNumber || command.courtOrderNumber.trim() === '')
    ) {
      throw new InvalidGuardianshipException(
        'Court order number is required for court-appointed guardians',
      );
    }

    // Validate court order format if provided
    if (command.courtOrderNumber) {
      const courtValidation = this.validateCourtOrder(
        command.courtOrderNumber,
        command.courtStation,
      );
      if (!courtValidation.isValid) {
        throw new InvalidGuardianshipException(`Invalid court order: ${courtValidation.reason}`);
      }
    }

    // Bond validation
    if (command.bondRequired) {
      if (!command.bondAmountKES) {
        throw new InvalidGuardianshipException('Bond amount is required when bond is required');
      }

      const bondValidation = this.validateBondDetails(command.bondAmountKES);
      if (!bondValidation.isValid) {
        throw new InvalidGuardianshipException(bondValidation.reason!);
      }
    }

    // Allowance validation
    if (command.annualAllowanceKES) {
      const allowanceValidation = this.validateAnnualAllowance(command.annualAllowanceKES);
      if (!allowanceValidation.isValid) {
        throw new InvalidGuardianshipException(allowanceValidation.reason!);
      }
    }
  }

  private handleErrorResult(
    error: unknown,
    command: CreateGuardianshipCommand,
  ): Result<GuardianshipResponse> {
    if (error instanceof InvalidGuardianshipException) {
      return Result.fail(error);
    }
    this.handleError(error, command, 'CreateGuardianshipHandler');
    return Result.fail(new Error('Failed to create guardianship'));
  }
}
