// application/dependency/commands/handlers/file-s26-claim.handler.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { DependencyAssessmentAggregate } from '../../../../domain/aggregates/dependency-assessment.aggregate';
import { LegalDependant } from '../../../../domain/entities/legal-dependant.entity';
import { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { FileS26ClaimCommand } from '../impl/file-s26-claim.command';
import { BaseCommandHandler, CommandHandlerResult } from './base.handler';

@Injectable()
export class FileS26ClaimHandler extends BaseCommandHandler<FileS26ClaimCommand> {
  constructor(
    repository: ILegalDependantRepository,
    eventPublisher: EventPublisher,
    private readonly mapper: DependencyMapper,
  ) {
    super(repository, eventPublisher);
  }

  async execute(command: FileS26ClaimCommand): Promise<CommandHandlerResult> {
    const startTime = Date.now();

    try {
      // 1. Validate command
      const validation = command.validate();
      if (!validation.isValid) {
        return this.createErrorResult(
          'Command validation failed',
          command,
          validation.errors,
          validation.warnings,
        );
      }

      // 2. Check permissions
      const permissionCheck = this.checkPermission(command.metadata, 'FILE_S26_CLAIM');
      if (!permissionCheck.hasPermission) {
        throw new ForbiddenException(permissionCheck.reason);
      }

      // 3. Load existing dependency
      const existingDependant = await this.repository.findById(command.dependencyAssessmentId);

      if (!existingDependant) {
        throw new NotFoundException(
          `Dependency assessment not found with ID: ${command.dependencyAssessmentId}`,
        );
      }

      // 4. Validate dependency qualifies for S.26 claim
      if (!this.canFileS26Claim(existingDependant)) {
        throw new BadRequestException(
          'Dependency does not qualify for S.26 claim. Only EX_SPOUSE or COHABITOR can file S.26 claims, or dependants with special circumstances.',
        );
      }

      // 5. Check if claim already exists
      if (existingDependant.isClaimant) {
        throw new BadRequestException('S.26 claim has already been filed for this dependency.');
      }

      // 6. Validate claim amount against dependency percentage
      if (existingDependant.dependencyPercentage < 25) {
        this.logger.warn(
          `Filing S.26 claim for dependant with low dependency percentage: ${existingDependant.dependencyPercentage}%`,
        );
      }

      // 7. Begin transaction
      await this.beginTransaction();

      try {
        // 8. Update domain entity
        const aggregate = DependencyAssessmentAggregate.createFromProps(existingDependant.toJSON());

        // File the S.26 claim
        aggregate.fileSection26Claim(command.amount, command.currency);

        // 9. Add supporting documents as evidence
        if (command.supportingDocuments && command.supportingDocuments.length > 0) {
          for (const document of command.supportingDocuments) {
            aggregate.addEvidence(document.documentId, `${command.claimType}_EVIDENCE`);
          }
        }

        // 10. Update other claim details
        // Note: The aggregate doesn't have methods for all claim details,
        // so we might need to extend the aggregate or handle separately
        this.updateClaimDetails(aggregate, command);

        // 11. Publish events
        this.eventPublisher.mergeObjectContext(aggregate);

        // 12. Convert to entity and save
        const updatedEntity = LegalDependant.createFromProps(aggregate.toJSON());
        const savedDependant = await this.repository.update(updatedEntity);

        // 13. Commit aggregate changes
        aggregate.commit();

        // 14. Commit transaction
        await this.commitTransaction();

        // 15. Map to response
        const response = this.mapper.toDependencyAssessmentResponse(savedDependant);

        // 16. Log success
        this.logCommandExecution(command, Date.now() - startTime, true);

        // 17. Trigger claim processing workflow (e.g., notify court, assign case number)
        await this.triggerClaimWorkflow(command, existingDependant);

        return this.createSuccessResult(
          response,
          'S.26 claim filed successfully',
          command,
          validation.warnings,
        );
      } catch (error) {
        await this.rollbackTransaction(error);
        throw error;
      }
    } catch (error) {
      this.logCommandExecution(command, Date.now() - startTime, false, error);

      if (error instanceof NotFoundException) {
        return this.createErrorResult(
          error.message,
          command,
          ['DEPENDENCY_NOT_FOUND'],
          command.validate().warnings,
        );
      }

      if (error instanceof ForbiddenException) {
        return this.createErrorResult(
          error.message,
          command,
          ['PERMISSION_DENIED'],
          command.validate().warnings,
        );
      }

      if (error instanceof BadRequestException) {
        return this.createErrorResult(
          error.message,
          command,
          ['INVALID_CLAIM'],
          command.validate().warnings,
        );
      }

      return this.createErrorResult(
        `Failed to file S.26 claim: ${error.message}`,
        command,
        ['EXECUTION_ERROR'],
        command.validate().warnings,
      );
    }
  }

  private canFileS26Claim(dependant: LegalDependant): boolean {
    // S.26 claims can be filed by:
    // 1. Ex-spouses
    // 2. Cohabitors (live-in partners)
    // 3. Any dependant in special circumstances not covered by S.29

    const eligibleBases = ['EX_SPOUSE', 'COHABITOR'];

    if (eligibleBases.includes(dependant.dependencyBasis)) {
      return true;
    }

    // Special circumstances
    if (dependant['hasDisability'] && dependant.requiresOngoingCare) {
      return true;
    }

    if (dependant.isMinor && !dependant['custodialParentId']) {
      return true;
    }

    return false;
  }

  private updateClaimDetails(
    aggregate: DependencyAssessmentAggregate,
    command: FileS26ClaimCommand,
  ): void {
    // Since the aggregate doesn't have methods for all claim details,
    // we might need to extend it or handle through additional properties

    // For now, we'll update through direct property access (if allowed by design)
    // Note: This should be properly encapsulated in the aggregate
    const props = aggregate['props'];

    // Store additional claim details
    props['claimType'] = command.claimType;
    props['claimReason'] = command.claimReason;
    props['claimStartDate'] = command.claimStartDate;
    props['claimEndDate'] = command.claimEndDate;
    props['courtCaseNumber'] = command.courtCaseNumber;
    props['legalRepresentativeId'] = command.legalRepresentativeId;
    props['monthlyBreakdownAmount'] = command.monthlyBreakdownAmount;
    props['numberOfMonths'] = command.numberOfMonths;
    props['declaredBy'] = command.declaredBy;
    props['declarationDate'] = command.declarationDate;
    props['hasFiledAffidavit'] = command.hasFiledAffidavit;
    props['affidavitFilingDate'] = command.affidavitFilingDate;

    // Increment version
    props['version'] += 1;
    props['updatedAt'] = new Date();
  }

  private async triggerClaimWorkflow(
    command: FileS26ClaimCommand,
    dependant: LegalDependant,
  ): Promise<void> {
    try {
      // This would trigger various workflows:
      // 1. Notify court registry
      // 2. Assign case number if not provided
      // 3. Schedule hearing dates
      // 4. Notify all parties

      this.logger.log(
        `Triggered S.26 claim workflow for assessment ${command.dependencyAssessmentId}`,
      );

      // Example: Generate case number if not provided
      if (!command.courtCaseNumber) {
        const caseNumber = await this.generateCaseNumber(dependant);
        this.logger.log(`Generated case number: ${caseNumber}`);
      }
    } catch (error) {
      this.logger.error('Failed to trigger claim workflow', error.stack);
      // Don't fail the command if workflow fails - the claim is still filed
    }
  }

  private async generateCaseNumber(dependant: LegalDependant): Promise<string> {
    // Generate a court case number based on standard format
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000);
    return `HC Succ Cause ${randomNum}/${year}`;
  }
}
