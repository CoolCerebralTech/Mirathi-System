import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { WriteOffDebtCommand } from '../../impl/debt/write-off-debt.command';

@CommandHandler(WriteOffDebtCommand)
export class WriteOffDebtHandler implements ICommandHandler<WriteOffDebtCommand> {
  private readonly logger = new Logger(WriteOffDebtHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: WriteOffDebtCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Writing off Debt ${dto.debtId} in Estate ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

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

      // Optional: Partial Write-off
      let amountToWriteOff: MoneyVO | undefined;
      if (dto.amountToWriteOff) {
        amountToWriteOff = MoneyVO.create({
          amount: dto.amountToWriteOff.amount,
          currency: dto.amountToWriteOff.currency,
        });
      }

      // Domain Logic: Write off logic
      debt.writeOff(dto.reason, dto.authorizedBy, amountToWriteOff);

      await this.estateRepository.save(estate);

      this.logger.log(`Debt ${dto.debtId} written off.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to write off debt: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
