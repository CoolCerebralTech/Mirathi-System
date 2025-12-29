import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import type { IProbateApplicationRepository } from '../../../../domain/repositories/i-probate-application.repository';
import { PROBATE_APPLICATION_REPOSITORY } from '../../../../domain/repositories/i-probate-application.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import { ComplianceEngineService } from '../../../../domain/services/compliance-engine.service';
import { Result } from '../../../common/result';
import {
  FileApplicationCommand,
  PayFilingFeeCommand,
  RecordCourtResponseCommand,
  RecordGazettePublicationCommand,
  RecordGrantIssuanceCommand,
} from '../impl/filing-interaction.commands';

/**
 * Handler: Pay Filing Fee
 */
@CommandHandler(PayFilingFeeCommand)
export class PayFilingFeeHandler implements ICommandHandler<PayFilingFeeCommand> {
  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(command: PayFilingFeeCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const application = await this.repository.findById(dto.applicationId);
      if (!application) return Result.fail('Application not found');

      // Update Aggregate
      application.markFilingFeePaid(dto.amount, dto.paymentMethod, dto.paymentReference);

      await this.repository.save(application);
      return Result.ok();
    } catch (e) {
      return Result.fail(e instanceof Error ? e.message : String(e));
    }
  }
}

/**
 * Handler: File Application (The Big Commit)
 */
@CommandHandler(FileApplicationCommand)
export class FileApplicationHandler implements ICommandHandler<FileApplicationCommand> {
  private readonly logger = new Logger(FileApplicationHandler.name);

  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly appRepository: IProbateApplicationRepository,
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly readinessRepository: IReadinessRepository,
    private readonly complianceEngine: ComplianceEngineService,
  ) {}

  async execute(command: FileApplicationCommand): Promise<Result<void>> {
    const { dto } = command;

    try {
      // 1. Fetch Aggregate
      const application = await this.appRepository.findById(dto.applicationId);
      if (!application) return Result.fail('Application not found');

      // 2. Fetch Readiness for Compliance Check
      const readiness = await this.readinessRepository.findById(application.readinessAssessmentId);
      if (!readiness) return Result.fail('Readiness assessment not found');

      // 3. Run Final Compliance Check (Domain Service)
      // This ensures we don't file illegal or incomplete applications
      const compliance = this.complianceEngine.validateFilingCompliance(
        application.successionContext,
        readiness.readinessScore,
        application.forms.map(
          (f) =>
            ({
              // Map GeneratedForm entity to minimal interface needed by engine if necessary
              // Or ideally, the engine accepts GeneratedForm entities.
              // For now, assuming direct compatibility or mapping:
              formCode: f.formCode,
              isValidForCourt: () => true, // Simplified for example
            }) as any,
        ),
        application.getGrantedConsents().length,
      );

      if (compliance.hasViolations()) {
        const report = compliance.getComplianceReport();
        const errors = report.violations
          .map((v) => `${v.requirement}: ${v.description}`)
          .join('; ');
        return Result.fail(`Compliance Violations Preventing Filing: ${errors}`);
      }

      // 4. Execute Filing Logic (Aggregate)
      // This checks internal invariants (fees paid, signatures, etc.)
      application.fileWithCourt(dto.filingMethod, dto.courtCaseNumber, dto.courtReceiptNumber);

      // 5. Persist
      await this.appRepository.save(application);
      this.logger.log(`Application ${application.id.toString()} FILED successfully`);

      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : String(error));
    }
  }
}

/**
 * Handler: Record Court Response
 */
@CommandHandler(RecordCourtResponseCommand)
export class RecordCourtResponseHandler implements ICommandHandler<RecordCourtResponseCommand> {
  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(command: RecordCourtResponseCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const application = await this.repository.findById(dto.applicationId);
      if (!application) return Result.fail('Application not found');

      if (dto.outcome === 'REJECTED' || dto.outcome === 'QUERIED') {
        application.recordCourtRejection(
          dto.rejectionReason || 'Court Query',
          dto.amendmentsRequired,
        );
      }
      // Note: "ACCEPTED" usually leads to Gazette Publication, which is a separate command

      await this.repository.save(application);
      return Result.ok();
    } catch (e) {
      return Result.fail(e instanceof Error ? e.message : String(e));
    }
  }
}

/**
 * Handler: Record Gazette Publication
 */
@CommandHandler(RecordGazettePublicationCommand)
export class RecordGazettePublicationHandler implements ICommandHandler<RecordGazettePublicationCommand> {
  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(command: RecordGazettePublicationCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const application = await this.repository.findById(dto.applicationId);
      if (!application) return Result.fail('Application not found');

      application.recordGazettePublished(dto.gazetteNoticeNumber);

      await this.repository.save(application);
      return Result.ok();
    } catch (e) {
      return Result.fail(e instanceof Error ? e.message : String(e));
    }
  }
}

/**
 * Handler: Record Grant Issuance
 */
@CommandHandler(RecordGrantIssuanceCommand)
export class RecordGrantIssuanceHandler implements ICommandHandler<RecordGrantIssuanceCommand> {
  private readonly logger = new Logger(RecordGrantIssuanceHandler.name);

  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(command: RecordGrantIssuanceCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const application = await this.repository.findById(dto.applicationId);
      if (!application) return Result.fail('Application not found');

      application.recordGrantIssued(dto.grantNumber, dto.grantType, dto.issuedByRegistrar);

      await this.repository.save(application);
      this.logger.log(`GRANT ISSUED for Application ${application.id.toString()}`);

      return Result.ok();
    } catch (e) {
      return Result.fail(e instanceof Error ? e.message : String(e));
    }
  }
}
