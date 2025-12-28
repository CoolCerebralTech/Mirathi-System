import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { RecordTaxAssessmentCommand } from '../../impl/tax/record-tax-assessment.command';

@CommandHandler(RecordTaxAssessmentCommand)
export class RecordTaxAssessmentHandler implements ICommandHandler<RecordTaxAssessmentCommand> {
  private readonly logger = new Logger(RecordTaxAssessmentHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: RecordTaxAssessmentCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Recording Tax Assessment for Estate ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      // Convert Money DTOs to numbers/primitives for the specific assessment method signature
      // The Domain method accepts an object with optional numbers
      const assessmentData = {
        incomeTax: dto.incomeTax?.amount,
        capitalGainsTax: dto.capitalGainsTax?.amount,
        stampDuty: dto.stampDuty?.amount,
        otherLevies: dto.otherLevies?.amount,
      };

      // Domain Logic
      // This updates the liability ledger and checks if we have enough cash reserved
      estate.recordTaxAssessment(assessmentData, dto.assessmentReference, dto.assessedBy);

      await this.estateRepository.save(estate);

      this.logger.log(`Tax Assessment recorded successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to record tax assessment: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
