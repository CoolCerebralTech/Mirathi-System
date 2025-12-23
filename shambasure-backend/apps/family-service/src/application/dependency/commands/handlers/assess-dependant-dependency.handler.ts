import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import { DependencyAssessmentAggregate } from '../../../../domain/aggregates/dependency-assessment.aggregate';
import { LegalDependant } from '../../../../domain/entities/legal-dependant.entity';
import type { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/idependency-assessment.repository';
import { Result } from '../../../common/base/result';
import { DependencyAssessmentResponse } from '../../dto/response/dependency-assessment.response';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { AssessFinancialDependencyCommand } from '../impl/assess-dependant-dependency.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(AssessFinancialDependencyCommand)
export class AssessFinancialDependencyHandler extends BaseCommandHandler<
  AssessFinancialDependencyCommand,
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
    command: AssessFinancialDependencyCommand,
  ): Promise<Result<DependencyAssessmentResponse>> {
    try {
      // 1. Basic Command Validation
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error ?? new Error('Command validation failed'));
      }

      // 2. Load Existing Entity
      const entity = await this.repository.findById(command.dependencyAssessmentId);
      if (!entity) {
        return Result.fail(
          new Error(`Dependency assessment not found: ${command.dependencyAssessmentId}`),
        );
      }

      // 3. Rehydrate Aggregate
      const aggregate = DependencyAssessmentAggregate.createFromProps(entity.toJSON());

      // 4. Perform Domain Action
      // (Validation logic like 'cannot reassess if court order exists' is inside the aggregate)
      if (command.monthlyNeeds && command.totalDeceasedIncome) {
        // Alternative Calculation Method
        aggregate.calculateFinancialDegree(
          command.monthlyNeeds,
          command.monthlySupportEvidence,
          command.totalDeceasedIncome,
        );
      } else {
        // Direct Assessment Method
        aggregate.assessFinancialDependency({
          monthlySupportEvidence: command.monthlySupportEvidence,
          dependencyRatio: command.dependencyRatio,
          dependencyPercentage: command.dependencyPercentage,
          assessmentMethod: command.assessmentMethod,
        });
      }

      // 5. Update Persistence
      const updatedEntity = LegalDependant.createFromProps(aggregate.toJSON());
      const savedEntity = await this.repository.update(updatedEntity);

      // 6. Publish Events
      await this.publishDomainEvents(aggregate);

      // 7. Response
      const response = this.mapper.toDependencyAssessmentResponse(savedEntity);
      const result = Result.ok(response);

      this.logSuccess(command, result, 'Financial Dependency Assessed');
      return result;
    } catch (error) {
      this.handleError(error, command, 'AssessFinancialDependencyHandler');
    }
  }
}
