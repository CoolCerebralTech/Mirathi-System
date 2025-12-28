import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { DisputeDebtCommand } from '../../impl/debt/dispute-debt.command';

@CommandHandler(DisputeDebtCommand)
export class DisputeDebtHandler implements ICommandHandler<DisputeDebtCommand> {
  private readonly logger = new Logger(DisputeDebtHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: DisputeDebtCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Disputing Debt ${dto.debtId} in Estate ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      // Find the specific debt entity within the aggregate
      const debt = estate.debts.find((d) => d.id.toString() === dto.debtId);
      if (!debt) {
        return Result.fail(new Error(`Debt ${dto.debtId} not found in estate`));
      }

      // Domain Logic: Mark as disputed
      // This stops it from being paid automatically by the S.45 engine
      debt.dispute(dto.reason, dto.disputedBy, dto.evidenceDocumentId);

      // Persist the entire Aggregate
      await this.estateRepository.save(estate);

      this.logger.log(`Debt ${dto.debtId} marked as disputed.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to dispute debt: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
