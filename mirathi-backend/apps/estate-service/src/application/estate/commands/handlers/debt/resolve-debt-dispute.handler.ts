import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { ResolveDebtDisputeCommand } from '../../impl/debt/resolve-debt-dispute.command';

@CommandHandler(ResolveDebtDisputeCommand)
export class ResolveDebtDisputeHandler implements ICommandHandler<ResolveDebtDisputeCommand> {
  private readonly logger = new Logger(ResolveDebtDisputeHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: ResolveDebtDisputeCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(`Resolving dispute for Debt ${dto.debtId} [CorrelationID: ${correlationId}]`);

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      const debt = estate.debts.find((d) => d.id.toString() === dto.debtId);
      if (!debt) {
        return Result.fail(new Error(`Debt ${dto.debtId} not found in estate`));
      }

      // Optional: Negotiated Amount
      let newAmount: MoneyVO | undefined;
      if (dto.negotiatedAmount) {
        newAmount = MoneyVO.create({
          amount: dto.negotiatedAmount.amount,
          currency: dto.negotiatedAmount.currency,
        });
      }

      // Domain Logic: Resolve and potentially resize the debt
      debt.resolveDispute(dto.resolution, dto.resolvedBy, newAmount);

      await this.estateRepository.save(estate);

      this.logger.log(`Debt dispute resolved successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to resolve dispute: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
