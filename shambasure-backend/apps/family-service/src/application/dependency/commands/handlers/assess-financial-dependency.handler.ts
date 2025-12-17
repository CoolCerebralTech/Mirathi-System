// application/dependency/commands/handlers/assess-financial-dependency.handler.ts
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
import { AssessFinancialDependencyCommand } from '../impl/assess-financial-dependency.command';
import { BaseCommandHandler, CommandHandlerResult } from './base.handler';

@Injectable()
export class AssessFinancialDependencyHandler extends BaseCommandHandler<AssessFinancialDependencyCommand> {
  constructor(
    repository: ILegalDependantRepository,
    eventPublisher: EventPublisher,
    private readonly mapper: DependencyMapper,
  ) {
    super(repository, eventPublisher);
  }

  async execute(command: AssessFinancialDependencyCommand): Promise<CommandHandlerResult> {
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
      const permissionCheck = this.checkPermission(command.metadata, 'ASSESS_FINANCIAL');
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

      // 4. Check if assessment can be updated (no court order issued)
      if (existingDependant.hasCourtOrder) {
        throw new BadRequestException(
          'Cannot reassess financial dependency after court provision order is issued.',
        );
      }

      // 5. Begin transaction
      await this.beginTransaction();

      try {
        // 6. Update domain entity
        // Option 1: Using Aggregate
        const aggregate = DependencyAssessmentAggregate.createFromProps(existingDependant.toJSON());

        // Perform financial assessment
        aggregate.assessFinancialDependency({
          monthlySupportEvidence: command.monthlySupportEvidence,
          dependencyRatio: command.dependencyRatio,
          dependencyPercentage: command.dependencyPercentage,
          assessmentMethod: command.assessmentMethod,
        });

        // If using alternative calculation method
        if (command.monthlyNeeds && command.totalDeceasedIncome) {
          aggregate.calculateFinancialDegree(
            command.monthlyNeeds,
            command.monthlySupportEvidence,
            command.totalDeceasedIncome,
          );
        }

        // 7. Add evidence documents if provided
        if (command.evidenceDocumentIds && command.evidenceDocumentIds.length > 0) {
          for (const documentId of command.evidenceDocumentIds) {
            aggregate.addEvidence(documentId, 'FINANCIAL_EVIDENCE');
          }
        }

        // 8. Publish events
        this.eventPublisher.mergeObjectContext(aggregate);

        // 9. Convert to entity and save
        const updatedEntity = LegalDependant.createFromProps(aggregate.toJSON());
        const savedDependant = await this.repository.update(updatedEntity);

        // 10. Commit aggregate changes
        aggregate.commit();

        // 11. Commit transaction
        await this.commitTransaction();

        // 12. Map to response
        const response = this.mapper.toDependencyAssessmentResponse(savedDependant);

        // 13. Log success
        this.logCommandExecution(command, Date.now() - startTime, true);

        return this.createSuccessResult(
          response,
          'Financial dependency assessed successfully',
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
          ['COURT_ORDER_EXISTS'],
          command.validate().warnings,
        );
      }

      return this.createErrorResult(
        `Failed to assess financial dependency: ${error.message}`,
        command,
        ['EXECUTION_ERROR'],
        command.validate().warnings,
      );
    }
  }

  // Additional validation specific to financial assessment
  protected validateMetadata(metadata: CommandMetadata): void {
    super.validateMetadata(metadata);

    // Financial assessors need additional validation
    if (metadata.userRole === 'EXPERT_ASSESSOR') {
      // Check if expert assessor has valid credentials
      // This could check against a registry of certified assessors
      this.logger.log(`Expert assessor ${metadata.userId} performing financial assessment`);
    }
  }
}
