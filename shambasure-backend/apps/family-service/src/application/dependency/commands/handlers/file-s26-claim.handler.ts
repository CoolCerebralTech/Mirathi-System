import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import { DependencyAssessmentAggregate } from '../../../../domain/aggregates/dependency-assessment.aggregate';
import { LegalDependant } from '../../../../domain/entities/legal-dependant.entity';
import type { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { Result } from '../../../common/base/result';
import { DependencyAssessmentResponse } from '../../dto/response/dependency-assessment.response';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { FileS26ClaimCommand } from '../impl/file-s26-claim.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(FileS26ClaimCommand)
export class FileS26ClaimHandler extends BaseCommandHandler<
  FileS26ClaimCommand,
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

  async execute(command: FileS26ClaimCommand): Promise<Result<DependencyAssessmentResponse>> {
    try {
      // 1. Validate Command
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

      // 3. S.26 Eligibility Check (Domain Logic)
      if (!this.canFileS26Claim(entity)) {
        return Result.fail(
          new Error(
            'Dependency does not qualify for S.26 claim. Only EX_SPOUSE, COHABITOR, or special circumstance dependants can file.',
          ),
        );
      }

      if (entity.isClaimant) {
        return Result.fail(new Error('S.26 claim has already been filed for this dependency.'));
      }

      // 4. Rehydrate Aggregate
      const aggregate = DependencyAssessmentAggregate.createFromProps(entity.toJSON());

      // 5. Execute Domain Logic
      aggregate.fileSection26Claim(command.amount, command.currency);

      // Add Evidence
      if (command.supportingDocuments?.length > 0) {
        for (const doc of command.supportingDocuments) {
          aggregate.addEvidence(doc.documentId, `${command.claimType}_EVIDENCE`);
        }
      }

      // Note: In a real implementation, we would call a specific method on aggregate
      // e.g., aggregate.updateClaimDetails(...) to handle reason, dates, etc.
      // For now, we assume fileSection26Claim captures the core financial intent.

      // 6. Persist
      const updatedEntity = LegalDependant.createFromProps(aggregate.toJSON());
      const savedEntity = await this.repository.update(updatedEntity);

      // 7. Publish Events
      await this.publishDomainEvents(aggregate);

      // 8. Response
      const response = this.mapper.toDependencyAssessmentResponse(savedEntity);
      const result = Result.ok(response);

      this.logSuccess(command, result, 'S.26 Claim Filed');
      return result;
    } catch (error) {
      this.handleError(error, command, 'FileS26ClaimHandler');
    }
  }

  private canFileS26Claim(dependant: LegalDependant): boolean {
    const eligibleBases = ['EX_SPOUSE', 'COHABITOR', 'CUSTOMARY_WIFE'];

    if (eligibleBases.includes(dependant.dependencyBasis)) {
      return true;
    }
    // S.26(a): Minor without custodial parent support
    if (dependant.isMinor && !dependant.custodialParentId) {
      return true;
    }
    // S.26(b): Disability requiring care
    if (dependant.hasDisability && dependant.requiresOngoingCare) {
      return true;
    }
    return false;
  }
}
