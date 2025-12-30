import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { ExecuteS45WaterfallCommand } from '../../impl/debt/execute-s45-waterfall.command';

@CommandHandler(ExecuteS45WaterfallCommand)
export class ExecuteS45WaterfallHandler implements ICommandHandler<ExecuteS45WaterfallCommand> {
  private readonly logger = new Logger(ExecuteS45WaterfallHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: ExecuteS45WaterfallCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Executing S.45 Waterfall for Estate ${dto.estateId} with amount ${dto.availableCash.amount} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      const availableCash = MoneyVO.create({
        amount: dto.availableCash.amount,
        currency: dto.availableCash.currency,
      });

      // --- DOMAIN LOGIC ---
      // Iteratively pays off debts from highest to lowest priority until cash runs out.
      estate.payHighestPriorityDebts(availableCash, dto.authorizedBy);

      await this.estateRepository.save(estate);

      this.logger.log(`S.45 Waterfall executed successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Waterfall execution failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
