// application/guardianship/commands/handlers/create-guardianship.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { CreateGuardianshipCommand } from '../impl/create-guardianship.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(CreateGuardianshipCommand)
export class CreateGuardianshipHandler
  extends BaseCommandHandler<CreateGuardianshipCommand, GuardianshipAggregate, string>
  implements ICommandHandler<CreateGuardianshipCommand, string>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: CreateGuardianshipCommand): Promise<string> {
    await this.ensureIdempotent(command);

    const guardianship = GuardianshipAggregate.create({
      wardInfo: command.wardInfo,
      guardianId: command.guardianId,
      guardianEligibility: command.guardianEligibility,
      type: command.type,
      appointmentDate: command.appointmentDate,
      courtOrderNumber: command.courtOrderNumber,
      courtStation: command.courtStation,
      validUntil: command.validUntil,
      hasPropertyManagementPowers: command.hasPropertyManagementPowers,
      canConsentToMedical: command.canConsentToMedical,
      canConsentToMarriage: command.canConsentToMarriage,
      restrictions: command.restrictions,
      specialInstructions: command.specialInstructions,
      bondRequired: command.bondRequired,
      bondAmountKES: command.bondAmountKES,
      annualAllowanceKES: command.annualAllowanceKES,
      customaryLawApplies: command.customaryLawApplies,
      customaryDetails: command.customaryDetails,
    });

    await this.repository.save(guardianship);

    this.publishEventsAndCommit(guardianship);

    this.logSuccess(command, `Guardianship ID: ${guardianship.id.toString()}`);

    return guardianship.id.toString();
  }
}
