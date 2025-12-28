import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { PayDebtCommand } from '../../impl/debt/pay-debt.command';

@CommandHandler(PayDebtCommand)
export class PayDebtHandler implements ICommandHandler<PayDebtCommand> {
  private readonly logger = new Logger(PayDebtHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: PayDebtCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Attempting payment for Debt ${dto.debtId} in Estate ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      const amount = MoneyVO.create({
        amount: dto.amount.amount,
        currency: dto.amount.currency,
      });

      // --- CRITICAL DOMAIN CALL ---
      // This method in the Aggregate Root acts as the S.45 Gatekeeper.
      // It will THROW if this payment violates the legal priority order.
      estate.payDebt(dto.debtId, amount, dto.paidBy);

      await this.estateRepository.save(estate);

      this.logger.log(`Debt payment recorded successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Payment failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Return the specific error message (e.g., "Cannot pay Unsecured Debt while Funeral Debt is outstanding")
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
