import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import { DependencyAssessmentAggregate } from '../../../../domain/aggregates/dependency-assessment.aggregate';
import { LegalDependant } from '../../../../domain/entities/legal-dependant.entity';
import type { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { Result } from '../../../common/base/result';
import { DependencyAssessmentResponse } from '../../dto/response/dependency-assessment.response';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { RecordCourtProvisionCommand } from '../impl/record-court-provision.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(RecordCourtProvisionCommand)
export class RecordCourtProvisionHandler extends BaseCommandHandler<
  RecordCourtProvisionCommand,
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
    command: RecordCourtProvisionCommand,
  ): Promise<Result<DependencyAssessmentResponse>> {
    try {
      // 1. Validate Command
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error ?? new Error('Command validation failed'));
      }

      // 2. Load Entity
      const entity = await this.repository.findById(command.dependencyAssessmentId);
      if (!entity) {
        return Result.fail(
          new Error(`Dependency assessment not found: ${command.dependencyAssessmentId}`),
        );
      }

      // 3. Validate Context
      if (command.legalSection === 'S26' && !entity.isClaimant) {
        return Result.fail(
          new Error('Cannot record S.26 provision for a dependant without a pending S.26 claim.'),
        );
      }

      // 4. Check for existing order
      if (entity.hasCourtOrder) {
        // Access props via toJSON to avoid TS error on missing getter
        const props = entity.toJSON();
        return Result.fail(
          new Error(
            `Court provision already recorded (Order: ${props.provisionOrderNumber}). Use update command.`,
          ),
        );
      }

      // 5. Rehydrate Aggregate
      const aggregate = DependencyAssessmentAggregate.createFromProps(entity.toJSON());

      // 6. Execute Domain Logic
      aggregate.recordCourtProvision({
        orderNumber: command.orderNumber,
        approvedAmount: command.approvedAmount,
        provisionType: command.provisionType,
        orderDate: command.orderDate,
      });

      // Verify evidence automatically if court approved
      if (command.approvedAmount > 0) {
        // Using 'SYSTEM' or specific admin ID as verifier
        aggregate.verifyEvidence('COURT_SYSTEM_AUTO_VERIFY', 'COURT_ORDER_CONFIRMATION');
      }

      // 7. Persist
      const updatedEntity = LegalDependant.createFromProps(aggregate.toJSON());
      const savedEntity = await this.repository.update(updatedEntity);

      // 8. Publish Events
      await this.publishDomainEvents(aggregate);

      // 9. Response
      const response = this.mapper.toDependencyAssessmentResponse(savedEntity);
      const result = Result.ok(response);

      this.logSuccess(command, result, 'Court Provision Recorded');
      return result;
    } catch (error) {
      this.handleError(error, command, 'RecordCourtProvisionHandler');
    }
  }
}
