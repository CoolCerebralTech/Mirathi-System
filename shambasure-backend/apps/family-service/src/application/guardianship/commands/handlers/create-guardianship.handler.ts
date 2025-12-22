// application/guardianship/commands/handlers/create-guardianship.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { CreateGuardianshipCommand } from '../impl/create-guardianship.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(CreateGuardianshipCommand)
export class CreateGuardianshipHandler
  extends baseCommandHandler.BaseCommandHandler<
    CreateGuardianshipCommand,
    GuardianshipAggregate,
    string
  >
  implements ICommandHandler<CreateGuardianshipCommand, string>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: CreateGuardianshipCommand): Promise<string> {
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

    await this.repository.save(guardianship, 0); // Version 0 for new aggregate

    this.publishEventsAndCommit(guardianship);

    this.logger.log(`Created guardianship ${guardianship.id} for ward ${command.wardInfo.wardId}`);

    return guardianship.id.toString();
  }
}
