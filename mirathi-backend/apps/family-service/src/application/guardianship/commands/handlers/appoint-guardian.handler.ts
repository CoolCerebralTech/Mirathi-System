// src/application/guardianship/commands/handlers/appoint-guardian.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus } from '@nestjs/cqrs';

// Domain Imports
import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { GuardianAssignmentEntity } from '../../../../domain/entities/guardian-assignment.entity';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
// Value Objects
import { GuardianContactVO } from '../../../../domain/value-objects/guardian-contact.vo';
import { GuardianshipPowersVO } from '../../../../domain/value-objects/guardianship-powers.vo';
// Base & Common
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { AppointGuardianCommand } from '../impl/appoint-guardian.command';

@CommandHandler(AppointGuardianCommand)
export class AppointGuardianHandler extends BaseCommandHandler<
  AppointGuardianCommand,
  GuardianshipAggregate,
  Result<string>
> {
  constructor(
    @Inject(GUARDIANSHIP_REPOSITORY)
    repo: IGuardianshipRepository,
    eventBus: EventBus,
  ) {
    super(eventBus, repo);
  }

  async execute(command: AppointGuardianCommand): Promise<Result<string>> {
    const { payload } = command;
    // We capture the ID to return it
    let assignmentId = '';

    try {
      await this.run(command, payload.guardianshipId, (aggregate) => {
        // 1. Construct Contact VO
        // The VO requires strict fields; we fill defaults for fields not in the simple Command DTO
        const contactVO = GuardianContactVO.create({
          primaryPhone: payload.contactInfo.primaryPhone,
          email: payload.contactInfo.email || 'pending-verification@system.local', // Fallback for required field
          physicalAddress: payload.contactInfo.physicalAddress,
          county: 'Nairobi', // TODO: Add county to Command DTO or extract from address
          preferredContactMethod: 'SMS',
          languagePreference: 'EN',
          receiveNotifications: true,
          emergencyContacts: [], // To be added via specific flow later
        });

        // 2. Construct Powers VO
        const powersVO = GuardianshipPowersVO.create({
          canManageProperty: payload.initialPowers.canManageProperty,
          canConsentMedical: payload.initialPowers.canMakeMedicalDecisions,
          canDecideEducation: payload.initialPowers.canChooseEducation,
          canTravelWithWard: payload.initialPowers.canTravelInternationally,
          canAccessRecords: true, // Default permission
          financialLimit: payload.initialPowers.spendingLimitPerTransaction,
          requiresCoSignature: payload.initialPowers.spendingLimitPerTransaction
            ? payload.initialPowers.spendingLimitPerTransaction > 50000
            : false,
        });

        // 3. Create Entity
        // FIX: Removed 'status' as it is Omitted in the factory type definition
        const assignment = GuardianAssignmentEntity.create({
          guardianId: payload.guardianMemberId,
          guardianName: payload.guardianName,
          role: payload.role,
          isPrimary: payload.isPrimary,
          isAlternate: !payload.isPrimary,
          appointmentDate: payload.appointmentDate,
          appointmentSource: payload.appointmentSource,
          contactInfo: contactVO,
          powers: powersVO,
          courtOrderReference: payload.courtOrderReference,
          notes: payload.notes,
        });

        assignmentId = assignment.id.toString();

        // 4. Domain Logic Injection
        aggregate.appointGuardian(assignment);
      });

      this.logSuccess(command, `Appointed Guardian ${payload.guardianName}`);
      return Result.ok(assignmentId);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
