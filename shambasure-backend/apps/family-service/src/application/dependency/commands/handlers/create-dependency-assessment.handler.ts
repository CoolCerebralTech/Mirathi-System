import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import { DependencyAssessmentAggregate } from '../../../../domain/aggregates/dependency-assessment.aggregate';
import {
  CreateLegalDependantProps,
  LegalDependant,
} from '../../../../domain/entities/legal-dependant.entity';
import type { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { Result } from '../../../common/base/result';
import { DependencyAssessmentResponse } from '../../dto/response/dependency-assessment.response';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { CreateDependencyAssessmentCommand } from '../impl/create-dependency-assessment.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(CreateDependencyAssessmentCommand)
export class CreateDependencyAssessmentHandler extends BaseCommandHandler<
  CreateDependencyAssessmentCommand,
  Result<DependencyAssessmentResponse>
> {
  constructor(
    private readonly repository: ILegalDependantRepository,
    private readonly mapper: DependencyMapper,
    commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(commandBus, eventBus);
  }

  async execute(
    command: CreateDependencyAssessmentCommand,
  ): Promise<Result<DependencyAssessmentResponse>> {
    try {
      // 1. Basic Command Validation
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error ?? new Error('Command validation failed'));
      }

      // 2. Business Logic Validation (Pre-Domain)
      const exists = await this.repository.existsByDeceasedAndDependant(
        command.deceasedId,
        command.dependantId,
      );
      if (exists) {
        return Result.fail(
          new Error(
            `Dependency assessment already exists for deceased ${command.deceasedId} and dependant ${command.dependantId}`,
          ),
        );
      }

      // 3. Map Command to Domain Props
      // We map directly here because Command has Date objects, while Mapper expects DTO Strings.
      const createProps: CreateLegalDependantProps = {
        deceasedId: command.deceasedId,
        dependantId: command.dependantId,
        dependencyBasis: command.dependencyBasis,
        isMinor: command.isMinor,
        dependencyLevel: command.dependencyLevel,
        isStudent: command.isStudent,
        hasPhysicalDisability: command.hasPhysicalDisability,
        hasMentalDisability: command.hasMentalDisability,
        requiresOngoingCare: command.requiresOngoingCare,
        disabilityDetails: command.disabilityDetails,
        monthlySupport: command.monthlySupport,
        supportStartDate: command.supportStartDate,
        supportEndDate: command.supportEndDate,
        assessmentMethod: command.assessmentMethod,
        dependencyPercentage: command.dependencyPercentage,
        custodialParentId: command.custodialParentId,
      };

      // 4. Create Aggregate (enforces strict S.29 invariants)
      const aggregate = DependencyAssessmentAggregate.create(createProps);

      // Add evidence from command if present
      if (command.dependencyProofDocuments && command.dependencyProofDocuments.length > 0) {
        for (const doc of command.dependencyProofDocuments) {
          aggregate.addEvidence(doc.documentId, doc.evidenceType);
        }
      }

      // 5. Persist
      // We persist the Entity state, but we keep the Aggregate for event publishing
      const entity = LegalDependant.createFromProps(aggregate.toJSON());
      const savedEntity = await this.repository.create(entity);

      // 6. Publish Domain Events
      await this.publishDomainEvents(aggregate);

      // 7. Response
      const response = this.mapper.toDependencyAssessmentResponse(savedEntity);
      const result = Result.ok(response);

      this.logSuccess(command, result, 'Dependency Assessment Created');
      return result;
    } catch (error) {
      this.handleError(error, command, 'CreateDependencyAssessmentHandler');
    }
  }
}
