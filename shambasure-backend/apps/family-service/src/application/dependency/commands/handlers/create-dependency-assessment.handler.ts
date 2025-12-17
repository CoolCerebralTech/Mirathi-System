// application/dependency/commands/handlers/create-dependency-assessment.handler.ts
import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { DependencyAssessmentAggregate } from '../../../../domain/aggregates/dependency-assessment.aggregate';
import { LegalDependant } from '../../../../domain/entities/legal-dependant.entity';
import { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { CreateDependencyAssessmentCommand } from '../impl/create-dependency-assessment.command';
import { BaseCommandHandler, CommandHandlerResult } from './base.handler';

@Injectable()
export class CreateDependencyAssessmentHandler extends BaseCommandHandler<CreateDependencyAssessmentCommand> {
  constructor(
    repository: ILegalDependantRepository,
    eventPublisher: EventPublisher,
    private readonly mapper: DependencyMapper,
  ) {
    super(repository, eventPublisher);
  }

  async execute(command: CreateDependencyAssessmentCommand): Promise<CommandHandlerResult> {
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
      const permissionCheck = this.checkPermission(command.metadata, 'CREATE_DEPENDENCY');
      if (!permissionCheck.hasPermission) {
        throw new ForbiddenException(permissionCheck.reason);
      }

      // 3. Check if dependency already exists
      const existingDependency = await this.repository.findByDeceasedAndDependant(
        command.deceasedId,
        command.dependantId,
      );

      if (existingDependency) {
        throw new ConflictException(
          `Dependency assessment already exists for deceased ${command.deceasedId} and dependant ${command.dependantId}`,
        );
      }

      // 4. Begin transaction
      await this.beginTransaction();

      try {
        // 5. Create domain entity
        const createProps = this.mapper.toCreateDependencyAssessmentProps(command);

        // Choose whether to use aggregate or entity based on your architecture
        // Option 1: Using Aggregate
        const aggregate = DependencyAssessmentAggregate.create(createProps);

        // Option 2: Using Entity (if you prefer that route)
        // const dependant = LegalDependant.create(createProps);

        // 6. Publish events (if using EventPublisher)
        this.eventPublisher.mergeObjectContext(aggregate);

        // 7. Save to repository
        // Note: We need to convert aggregate to entity if repository expects entity
        // For now, let's assume repository accepts aggregate or we have a method for it
        // We'll need to adapt based on your actual repository interface

        // Create entity from aggregate props
        const dependantEntity = LegalDependant.createFromProps(aggregate.toJSON());
        const savedDependant = await this.repository.create(dependantEntity);

        // 8. Commit aggregate changes (publishes domain events)
        aggregate.commit();

        // 9. Commit transaction
        await this.commitTransaction();

        // 10. Map to response
        const response = this.mapper.toDependencyAssessmentResponse(savedDependant);

        // 11. Log success
        this.logCommandExecution(command, Date.now() - startTime, true);

        return this.createSuccessResult(
          response,
          'Dependency assessment created successfully',
          command,
          validation.warnings,
        );
      } catch (error) {
        // Rollback transaction on error
        await this.rollbackTransaction(error);
        throw error;
      }
    } catch (error) {
      // Handle specific errors
      this.logCommandExecution(command, Date.now() - startTime, false, error);

      if (error instanceof ConflictException) {
        return this.createErrorResult(
          error.message,
          command,
          ['DUPLICATE_DEPENDENCY'],
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

      // Generic error
      return this.createErrorResult(
        `Failed to create dependency assessment: ${error.message}`,
        command,
        ['EXECUTION_ERROR'],
        command.validate().warnings,
      );
    }
  }

  // Override permission check for specific requirements
  protected checkPermission(
    metadata: CommandMetadata,
    operation: string,
  ): { hasPermission: boolean; reason?: string } {
    const baseCheck = super.checkPermission(metadata, operation);

    if (!baseCheck.hasPermission) {
      return baseCheck;
    }

    // Additional checks specific to dependency creation
    // Example: Only court officials can create dependency for EX_SPOUSE or COHABITOR
    const restrictedBases = ['EX_SPOUSE', 'COHABITOR'];
    if (restrictedBases.includes(this['command']?.dependencyBasis)) {
      const courtRoles = ['JUDGE', 'REGISTRAR', 'COURT_CLERK'];
      if (!courtRoles.includes(metadata.userRole)) {
        return {
          hasPermission: false,
          reason: `Only court officials can create dependency assessments for ${this['command']?.dependencyBasis}`,
        };
      }
    }

    return baseCheck;
  }
}
