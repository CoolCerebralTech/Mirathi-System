import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { AssetLiquidation } from '../../../../../domain/entities/asset-liquidation.entity';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import {
  ApproveLiquidationCommand,
  CancelLiquidationCommand,
  InitiateLiquidationCommand,
  ReceiveLiquidationProceedsCommand,
  RecordLiquidationSaleCommand,
  SubmitLiquidationForApprovalCommand,
} from '../../impl/liquidation/liquidation.commands';

@CommandHandler(InitiateLiquidationCommand)
export class InitiateLiquidationHandler implements ICommandHandler<InitiateLiquidationCommand> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: InitiateLiquidationCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const targetAmount = MoneyVO.create({
        amount: dto.targetAmount.amount,
        currency: dto.targetAmount.currency,
      });

      const liquidation = AssetLiquidation.create({
        estateId: dto.estateId,
        assetId: dto.assetId,
        liquidationType: dto.liquidationType,
        targetAmount: targetAmount,
        liquidationNotes: dto.reason,
        liquidatedBy: dto.initiatedBy,
      });

      estate.initiateLiquidation(dto.assetId, liquidation, dto.initiatedBy);
      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

@CommandHandler(SubmitLiquidationForApprovalCommand)
export class SubmitLiquidationForApprovalHandler implements ICommandHandler<SubmitLiquidationForApprovalCommand> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}
  async execute(command: SubmitLiquidationForApprovalCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const liquidation = estate.activeLiquidations.find(
        (l) => l.id.toString() === dto.liquidationId,
      );
      if (!liquidation) return Result.fail(new Error(`Liquidation not found`));

      liquidation.submitForApproval(dto.submittedBy);
      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

@CommandHandler(ApproveLiquidationCommand)
export class ApproveLiquidationHandler implements ICommandHandler<ApproveLiquidationCommand> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}
  async execute(command: ApproveLiquidationCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const liquidation = estate.activeLiquidations.find(
        (l) => l.id.toString() === dto.liquidationId,
      );
      if (!liquidation) return Result.fail(new Error(`Liquidation not found`));

      liquidation.markAsCourtApproved(dto.approvedBy, dto.courtOrderReference);
      // Automatically list for sale after approval
      liquidation.listForSale();

      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

@CommandHandler(RecordLiquidationSaleCommand)
export class RecordLiquidationSaleHandler implements ICommandHandler<RecordLiquidationSaleCommand> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}
  async execute(command: RecordLiquidationSaleCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const liquidation = estate.activeLiquidations.find(
        (l) => l.id.toString() === dto.liquidationId,
      );
      if (!liquidation) return Result.fail(new Error(`Liquidation not found`));

      const actualAmount = MoneyVO.create({
        amount: dto.actualAmount.amount,
        currency: dto.actualAmount.currency,
      });

      liquidation.markSaleCompleted(actualAmount, dto.buyerName, dto.buyerIdNumber, dto.recordedBy);

      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

@CommandHandler(ReceiveLiquidationProceedsCommand)
export class ReceiveLiquidationProceedsHandler implements ICommandHandler<ReceiveLiquidationProceedsCommand> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}
  async execute(command: ReceiveLiquidationProceedsCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const netProceeds = MoneyVO.create({
        amount: dto.netProceeds.amount,
        currency: dto.netProceeds.currency,
      });

      // Calls estate method which handles cash update and liquidation status update
      estate.completeLiquidation(dto.liquidationId, netProceeds, dto.receivedBy);

      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

@CommandHandler(CancelLiquidationCommand)
export class CancelLiquidationHandler implements ICommandHandler<CancelLiquidationCommand> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}
  async execute(command: CancelLiquidationCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const liquidation = estate.activeLiquidations.find(
        (l) => l.id.toString() === dto.liquidationId,
      );
      if (!liquidation) return Result.fail(new Error(`Liquidation not found`));

      liquidation.cancel(dto.reason);

      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
