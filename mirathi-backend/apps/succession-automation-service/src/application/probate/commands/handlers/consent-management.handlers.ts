import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ConsentMethod } from '../../../../domain/entities/family-consent.entity';
// Import type to prevent circular dependency/metadata errors
import type { IProbateApplicationRepository } from '../../../../domain/repositories/i-probate-application.repository';
import { PROBATE_APPLICATION_REPOSITORY } from '../../../../domain/repositories/i-probate-application.repository';
import { Result } from '../../../common/result';
import { ConsentCommunicationService } from '../../services/consent-management/consent-communication.service';
import {
  RecordConsentDeclineCommand,
  RecordConsentGrantCommand,
  RequestFamilyConsentCommand,
} from '../impl/consent-management.commands';

/**
 * Handler: Request Family Consent
 *
 * LOGIC:
 * 1. Load Aggregate.
 * 2. Validate consent exists and is PENDING.
 * 3. Use Communication Service to send SMS/Email with secure link.
 * 4. Update Aggregate state (mark request as sent).
 * 5. Persist.
 */
@CommandHandler(RequestFamilyConsentCommand)
export class RequestFamilyConsentHandler implements ICommandHandler<RequestFamilyConsentCommand> {
  private readonly logger = new Logger(RequestFamilyConsentHandler.name);

  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
    private readonly communicationService: ConsentCommunicationService,
  ) {}

  async execute(command: RequestFamilyConsentCommand): Promise<Result<void>> {
    const { dto } = command;

    try {
      // 1. Load Aggregate
      const application = await this.repository.findById(dto.applicationId);
      if (!application) return Result.fail(`Application not found: ${dto.applicationId}`);

      // 2. Find Consent Entity
      const consent = application.consents.find((c) => c.id.equals(dto.consentId));
      if (!consent) return Result.fail(`Consent record not found: ${dto.consentId}`);

      // 3. Send Communication (Side Effect)
      // Note: We do this BEFORE updating state to ensure delivery,
      // or we could use an Event Listener if we want eventual consistency.
      // For this workflow, immediate feedback is better.
      await this.communicationService.sendConsentRequest(
        consent,
        application.applicantFullName,
        'Deceased Name Placeholder', // In real app, fetch from Estate Aggregate
      );

      // 4. Update Aggregate State
      // This enforces business rules (e.g., must have contact info)
      application.sendConsentRequest(dto.consentId, dto.method);

      // 5. Persist
      await this.repository.save(application);
      this.logger.log(`Consent request sent to ${consent.fullName} (${dto.method})`);

      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to send consent request: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

/**
 * Handler: Record Consent Grant
 *
 * LOGIC:
 * 1. Load Aggregate.
 * 2. Validate token (if provided) via Communication Service.
 * 3. Update Aggregate state (GRANTED).
 * 4. Check if "All Consents Received" -> Update Application Status.
 * 5. Persist.
 */
@CommandHandler(RecordConsentGrantCommand)
export class RecordConsentGrantHandler implements ICommandHandler<RecordConsentGrantCommand> {
  private readonly logger = new Logger(RecordConsentGrantHandler.name);

  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
    private readonly communicationService: ConsentCommunicationService,
  ) {}

  async execute(command: RecordConsentGrantCommand): Promise<Result<void>> {
    const { dto } = command;

    try {
      const application = await this.repository.findById(dto.applicationId);
      if (!application) return Result.fail('Application not found');

      // 1. Verify Token (if digital)
      if (dto.method !== ConsentMethod.IN_PERSON && dto.verificationToken) {
        const verification = await this.communicationService.verifyDigitalConsent(
          dto.verificationToken,
        );
        if (!verification.isValid) {
          return Result.fail('Invalid or expired consent verification token');
        }
      }

      // 2. Update Aggregate
      // This method also checks "areAllConsentsReceived()" internally
      // and emits "AllConsentsReceived" event if true.
      application.recordConsentGranted(dto.consentId, dto.method);

      // 3. Persist
      await this.repository.save(application);
      this.logger.log(
        `Consent granted for ${dto.consentId} in application ${application.id.toString()}`,
      );

      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : String(error));
    }
  }
}

/**
 * Handler: Record Consent Decline
 *
 * LOGIC:
 * 1. Load Aggregate.
 * 2. Record decline reason (This effectively BLOCKS the application).
 * 3. Persist.
 * 4. (Implicit) Readiness Service listening to events will flag this as a RISK.
 */
@CommandHandler(RecordConsentDeclineCommand)
export class RecordConsentDeclineHandler implements ICommandHandler<RecordConsentDeclineCommand> {
  private readonly logger = new Logger(RecordConsentDeclineHandler.name);

  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(command: RecordConsentDeclineCommand): Promise<Result<void>> {
    const { dto } = command;

    try {
      const application = await this.repository.findById(dto.applicationId);
      if (!application) return Result.fail('Application not found');

      // Update Aggregate
      application.recordConsentDeclined(dto.consentId, dto.reason, dto.category);

      await this.repository.save(application);
      this.logger.warn(
        `Consent DECLINED for application ${application.id.toString()}: ${dto.reason}`,
      );

      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : String(error));
    }
  }
}
