import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { ApplyForTaxExemptionCommand } from '../../impl/tax/apply-for-tax-exemption.command';

@CommandHandler(ApplyForTaxExemptionCommand)
export class ApplyForTaxExemptionHandler implements ICommandHandler<ApplyForTaxExemptionCommand> {
  private readonly logger = new Logger(ApplyForTaxExemptionHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: ApplyForTaxExemptionCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Applying for Tax Exemption for Estate ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      // Domain Logic
      // The Entity validates that the estate qualifies (e.g., value < threshold)
      estate.taxCompliance.markAsExempt(
        dto.reason,
        dto.exemptionCertificateNo,
        dto.appliedBy,
        dto.exemptionDate,
      );

      await this.estateRepository.save(estate);

      this.logger.log(`Tax Exemption applied successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to apply for tax exemption: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
