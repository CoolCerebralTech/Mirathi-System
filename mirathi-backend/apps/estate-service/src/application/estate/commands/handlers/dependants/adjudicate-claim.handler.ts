import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import {
  RejectDependantClaimCommand,
  SettleDependantClaimCommand,
  VerifyDependantClaimCommand,
} from '../../impl/dependants/adjudicate-claim.command';

@CommandHandler(VerifyDependantClaimCommand)
export class VerifyDependantClaimHandler implements ICommandHandler<VerifyDependantClaimCommand> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: VerifyDependantClaimCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const dependant = estate.dependants.find((d) => d.id.toString() === dto.dependantId);
      if (!dependant) return Result.fail(new Error(`Dependant not found`));

      dependant.verifyClaim(dto.verifiedBy, dto.verificationNotes);
      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

@CommandHandler(RejectDependantClaimCommand)
export class RejectDependantClaimHandler implements ICommandHandler<RejectDependantClaimCommand> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: RejectDependantClaimCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const dependant = estate.dependants.find((d) => d.id.toString() === dto.dependantId);
      if (!dependant) return Result.fail(new Error(`Dependant not found`));

      dependant.rejectClaim(dto.reason, dto.rejectedBy);
      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

@CommandHandler(SettleDependantClaimCommand)
export class SettleDependantClaimHandler implements ICommandHandler<SettleDependantClaimCommand> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: SettleDependantClaimCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const dependant = estate.dependants.find((d) => d.id.toString() === dto.dependantId);
      if (!dependant) return Result.fail(new Error(`Dependant not found`));

      const allocation = MoneyVO.create({
        amount: dto.allocation.amount,
        currency: dto.allocation.currency,
      });

      dependant.settleClaim(allocation, dto.settledBy, dto.settlementMethod);
      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
