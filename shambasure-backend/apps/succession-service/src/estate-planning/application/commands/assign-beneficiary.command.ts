import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AssignBeneficiaryDto } from '../dto/request/assign-beneficiary.dto';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import {
  BeneficiaryAssignment,
  BeneficiaryIdentity,
} from '../../domain/entities/beneficiary.entity';
import { SharePercentage } from '../../domain/value-objects/share-percentage.vo';
import { AssetValue } from '../../domain/value-objects/asset-value.vo';
import { BequestType } from '@prisma/client';

export class AssignBeneficiaryCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string, // Testator
    public readonly dto: AssignBeneficiaryDto,
  ) {}
}

@CommandHandler(AssignBeneficiaryCommand)
export class AssignBeneficiaryHandler implements ICommandHandler<AssignBeneficiaryCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: AssignBeneficiaryCommand): Promise<string> {
    const { willId, userId, dto } = command;

    // 1. Load Aggregate
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException(`Will ${willId} not found.`);

    // 2. Security Check
    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Ownership mismatch.');
    }

    // 3. Validate Asset Existence in Will
    // The Aggregate throws if asset is missing, but checking here is cleaner for HTTP errors
    const assetIds = aggregate.getAssets().map((a) => a.getId());
    if (!assetIds.includes(dto.assetId)) {
      throw new NotFoundException(`Asset ${dto.assetId} is not part of this will.`);
    }

    // 4. Construct Identity
    const identity: BeneficiaryIdentity = {
      userId: dto.userId,
      familyMemberId: dto.familyMemberId,
      externalName: dto.externalName,
      relationship: dto.relationship,
    };

    // 5. Construct Entity
    const assignmentId = uuidv4();
    const assignment = BeneficiaryAssignment.create(
      assignmentId,
      willId,
      dto.assetId,
      identity,
      dto.bequestType,
    );

    // 6. Apply Specifics (Share vs Amount)
    if (dto.bequestType === BequestType.PERCENTAGE && dto.sharePercentage) {
      const share = new SharePercentage(dto.sharePercentage);
      assignment.setSharePercentage(share, userId);
    } else if (dto.bequestType === BequestType.SPECIFIC && dto.specificAmount) {
      const amount = new AssetValue(dto.specificAmount.amount, dto.specificAmount.currency);
      assignment.setSpecificAmount(amount, userId);
    }

    // 7. Apply Conditions
    if (dto.conditionType && dto.conditionDetails) {
      assignment.addCondition(dto.conditionType, dto.conditionDetails);
    }

    // 8. Add to Aggregate (Triggers Total % Validation)
    const willModel = this.publisher.mergeObjectContext(aggregate);

    try {
      willModel.assignBeneficiary(assignment);
    } catch (error) {
      throw new BadRequestException(error.message); // Catch "Total exceeds 100%" errors
    }

    // 9. Save
    await this.willRepository.save(willModel);
    willModel.commit();

    return assignmentId;
  }
}
