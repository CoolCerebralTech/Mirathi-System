// application/guardianship/commands/handlers/appoint-guardian.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { GuardianType } from '@prisma/client';

import { Guardian } from '../../../../domain/entities/guardian.entity';
import { GuardianDomainException } from '../../../../domain/exceptions/guardianship.exception';
import { IGuardianRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { AppointGuardianCommand } from '../impl/appoint-guardian.command';
import { ICommandHandler } from './base.handler';

@Injectable()
export class AppointGuardianHandler implements ICommandHandler<AppointGuardianCommand> {
  private readonly logger = new Logger(AppointGuardianHandler.name);

  constructor(private readonly guardianRepository: IGuardianRepository) {}

  async execute(command: AppointGuardianCommand): Promise<Guardian> {
    this.logger.log(`Executing ${command.getCommandName()} for ward: ${command.wardId}`);

    try {
      // Validate command
      const errors = command.validate();
      if (errors.length > 0) {
        throw new GuardianDomainException(`Command validation failed: ${errors.join(', ')}`);
      }

      // Check if guardian already exists for this ward
      const existingGuardian = await this.guardianRepository.findActiveByWardId(command.wardId);
      if (existingGuardian) {
        throw new GuardianDomainException(
          `Active guardianship already exists for ward: ${command.wardId}`,
        );
      }

      // Create guardian entity
      const guardian = Guardian.create({
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

      // Save guardian
      const savedGuardian = await this.guardianRepository.create(guardian);

      this.logger.log(`Guardian appointed successfully: ${savedGuardian.id}`);
      return savedGuardian;
    } catch (error) {
      this.logger.error(`Failed to appoint guardian: ${error.message}`, error.stack);
      throw error;
    }
  }
}
