import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { Debt } from '../../../../../domain/entities/debt.entity';
import { DebtTier } from '../../../../../domain/enums/debt-tier.enum';
import { DebtType } from '../../../../../domain/enums/debt-type.enum';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { DebtPriorityVO } from '../../../../../domain/value-objects/debt-priority.vo';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { AddDebtCommand } from '../../impl/debt/add-debt.command';

@CommandHandler(AddDebtCommand)
export class AddDebtHandler implements ICommandHandler<AddDebtCommand> {
  private readonly logger = new Logger(AddDebtHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: AddDebtCommand): Promise<Result<void>> {
    const { dto, userId, correlationId } = command;

    this.logger.log(
      `Adding Debt '${dto.description}' to Estate: ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      // 1. Create Money Value Object
      const initialAmount = MoneyVO.create({
        amount: dto.initialAmount.amount,
        currency: dto.initialAmount.currency,
      });

      // 2. Determine Priority (S.45 Logic Map)
      let priority: DebtPriorityVO;

      // Basic mapping strategy based on Debt Type
      // In a real scenario, this mapping might live in a Domain Service or Helper
      if ([DebtType.FUNERAL_EXPENSES].includes(dto.type)) {
        priority = DebtPriorityVO.createFuneralExpense(dto.type);
      } else if ([DebtType.MORTGAGE, DebtType.ASSET_FINANCE].includes(dto.type)) {
        priority = DebtPriorityVO.createSecuredDebt(dto.type);
      } else if ([DebtType.TAX_ARREARS, DebtType.ESTATE_DUTY].includes(dto.type)) {
        // Taxes are usually Tier 4 (S.45(c))
        priority = DebtPriorityVO.create({ tier: DebtTier.TAXES_RATES_WAGES, type: dto.type });
      } else {
        priority = DebtPriorityVO.createUnsecuredDebt(dto.type);
      }

      // 3. Create Debt Entity
      const debt = Debt.create({
        estateId: dto.estateId,
        creditorName: dto.creditorName,
        description: dto.description,
        initialAmount,
        outstandingBalance: initialAmount, // Starts full
        currency: dto.initialAmount.currency,
        priority,
        type: dto.type,
        isSecured: !!dto.securedAssetId,
        securedAssetId: dto.securedAssetId,
        dueDate: dto.dueDate,
        referenceNumber: dto.referenceNumber,
        requiresCourtApproval: false, // Default
      });

      // 4. Add to Estate (Triggers solvency check & cash reservation)
      estate.addDebt(debt, userId);

      // 5. Save
      await this.estateRepository.save(estate);

      this.logger.log(`Debt added successfully. ID: ${debt.id.toString()}`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to add debt: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
