import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { BequestType } from '@prisma/client';

// Reusing or extending
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { AssetValue } from '../../domain/value-objects/asset-value.vo';
import { SharePercentage } from '../../domain/value-objects/share-percentage.vo';
import { AssignBeneficiaryDto } from '../dto/request/assign-beneficiary.dto';

// Define Command using Partial DTO logic
export class UpdateBeneficiaryCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
    public readonly assignmentId: string,
    public readonly dto: Partial<AssignBeneficiaryDto>,
  ) {}
}

@CommandHandler(UpdateBeneficiaryCommand)
export class UpdateBeneficiaryHandler implements ICommandHandler<UpdateBeneficiaryCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdateBeneficiaryCommand): Promise<void> {
    const { willId, userId, assignmentId, dto } = command;

    // 1. Load Aggregate
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException(`Will ${willId} not found.`);

    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Ownership mismatch.');
    }

    // 2. Find Assignment within Aggregate
    const assignment = aggregate.getBeneficiaries().find((b) => b.getId() === assignmentId);
    if (!assignment) {
      throw new NotFoundException(`Beneficiary Assignment ${assignmentId} not found.`);
    }

    // 3. Apply Updates
    // Note: Changing BequestType usually requires resetting values.
    // For simplicity, we enforce strict types.

    if (dto.sharePercentage && assignment.getBequestType() === BequestType.PERCENTAGE) {
      const newShare = new SharePercentage(dto.sharePercentage);
      // We don't set it directly on entity yet; we need Aggregate validation first?
      // Actually, Entity updates self, Aggregate validation runs on "save/validate" or we call a check.
      // Ideally, we remove and re-add, or we just set it and let a Policy check later.
      // But `WillAggregate.assignBeneficiary` does the check.
      // Here, we modify the entity directly.

      // To ensure consistency, we might manually invoke validation logic:
      // aggregate.validateTotalPercentage(assignment.getAssetId(), newShare, assignmentId);

      assignment.setSharePercentage(newShare, userId);
    }

    if (dto.specificAmount && assignment.getBequestType() === BequestType.SPECIFIC) {
      const amount = new AssetValue(dto.specificAmount.amount, dto.specificAmount.currency);
      assignment.setSpecificAmount(amount, userId);
    }

    if (dto.conditionType && dto.conditionDetails) {
      assignment.addCondition(dto.conditionType, dto.conditionDetails);
    } else if (dto.conditionType === 'NONE') {
      // Logic to clear condition
      assignment.removeCondition();
    }

    // 4. Save (Aggregate saves all children)
    const willModel = this.publisher.mergeObjectContext(aggregate);

    // Optional: Re-run full aggregate validation if needed
    // const validation = willModel.validateWillCompleteness();
    // if (!validation.isValid) ...

    await this.willRepository.save(willModel);
    willModel.commit();
  }
}
