import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ProbateApplication } from '../../../../domain/aggregates/probate-application.aggregate';
// FIX 1: Use 'import type' for interfaces to prevent TS1272
import type { IProbateApplicationRepository } from '../../../../domain/repositories/i-probate-application.repository';
import { PROBATE_APPLICATION_REPOSITORY } from '../../../../domain/repositories/i-probate-application.repository';
// FIX 2: Correct interface name based on the file provided
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import { SuccessionContext } from '../../../../domain/value-objects/succession-context.vo';
import { Result } from '../../../common/result';
import {
  AutoGenerateApplicationCommand,
  CreateApplicationCommand,
  WithdrawApplicationCommand,
} from '../impl/lifecycle.commands';

/**
 * Handler: Create Application (Manual)
 */
@CommandHandler(CreateApplicationCommand)
export class CreateApplicationHandler implements ICommandHandler<CreateApplicationCommand> {
  private readonly logger = new Logger(CreateApplicationHandler.name);

  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(command: CreateApplicationCommand): Promise<Result<string>> {
    const { dto } = command;

    try {
      // 1. Duplicate Check
      const existingApp = await this.repository.findByEstateId(dto.estateId);
      if (existingApp) {
        return Result.fail(`Probate application already exists for Estate ID: ${dto.estateId}`);
      }

      // 2. Build Value Objects
      // Convert plain object to Immutable Value Object
      const context = SuccessionContext.create(dto.successionContext);

      // 3. Create Aggregate
      const application = ProbateApplication.create(
        dto.estateId,
        dto.readinessAssessmentId,
        context,
        dto.applicationType,
        dto.applicantUserId,
        dto.applicantFullName,
        dto.applicantRelationship,
        dto.applicantContact,
        dto.targetCourtJurisdiction,
        dto.targetCourtName,
        dto.courtStation,
        dto.priority,
      );

      // 4. Persist
      await this.repository.save(application);

      // FIX 3: .toString() on UniqueEntityID
      this.logger.log(
        `Created Probate Application ${application.id.toString()} for Estate ${dto.estateId}`,
      );

      return Result.ok(application.id.toString());
    } catch (error) {
      this.logger.error(
        `Failed to create application: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
}

/**
 * Handler: Auto-Generate from Readiness
 */
@CommandHandler(AutoGenerateApplicationCommand)
export class AutoGenerateApplicationHandler implements ICommandHandler<AutoGenerateApplicationCommand> {
  private readonly logger = new Logger(AutoGenerateApplicationHandler.name);

  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly appRepository: IProbateApplicationRepository,
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly readinessRepository: IReadinessRepository,
  ) {}

  async execute(command: AutoGenerateApplicationCommand): Promise<Result<string>> {
    const { dto } = command;

    try {
      // 1. Fetch Readiness
      const assessment = await this.readinessRepository.findById(dto.readinessAssessmentId);
      if (!assessment) {
        return Result.fail(`Readiness Assessment not found: ${dto.readinessAssessmentId}`);
      }

      // 2. Validate Pre-requisites
      if (assessment.readinessScore.isBlocked()) {
        return Result.fail('Cannot auto-generate application: Readiness Assessment is BLOCKED.');
      }

      // Check for duplicates
      const existingApp = await this.appRepository.findByEstateId(dto.estateId);
      if (existingApp) {
        // Idempotency: Return existing ID if already created
        return Result.ok(existingApp.id.toString());
      }

      // 3. Create Aggregate via Auto-Gen Factory
      // Note: Passing hardcoded placeholders for applicant info if not in DTO.
      // In a real scenario, you might fetch the User Entity here.
      const application = ProbateApplication.autoGenerate(
        dto.estateId,
        dto.readinessAssessmentId,
        assessment.readinessScore,
        assessment.successionContext,
        dto.applicantUserId,
        'Applicant Name', // Placeholder if not in DTO
        'Applicant', // Placeholder
        { email: 'applicant@example.com' },
      );

      // 4. Persist
      await this.appRepository.save(application);

      // FIX 3: .toString() on UniqueEntityID
      this.logger.log(
        `Auto-generated Application ${application.id.toString()} from Readiness ${dto.readinessAssessmentId}`,
      );

      return Result.ok(application.id.toString());
    } catch (error) {
      this.logger.error(
        `Auto-generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

/**
 * Handler: Withdraw Application
 */
@CommandHandler(WithdrawApplicationCommand)
export class WithdrawApplicationHandler implements ICommandHandler<WithdrawApplicationCommand> {
  private readonly logger = new Logger(WithdrawApplicationHandler.name);

  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(command: WithdrawApplicationCommand): Promise<Result<void>> {
    const { dto } = command;

    try {
      // 1. Fetch Aggregate
      const application = await this.repository.findById(dto.applicationId);
      if (!application) {
        return Result.fail('Probate Application not found');
      }

      // 2. Execute Logic
      application.withdrawApplication(dto.reason);

      // 3. Persist
      await this.repository.save(application);

      this.logger.log(`Application ${dto.applicationId} withdrawn by ${dto.withdrawnByUserId}`);

      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : String(error));
    }
  }
}
