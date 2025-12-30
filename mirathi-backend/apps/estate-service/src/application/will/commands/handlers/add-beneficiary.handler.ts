import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueEntityID } from 'apps/estate-service/src/domain/base/unique-entity-id';

import { AppErrors } from '../../../common/application.error';
import { Result } from '../../../common/result';
import { WillBequest } from '../../../../domain/entities/beneficiary-assignment.entity';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { BeneficiaryIdentity } from '../../../../domain/value-objects/beneficiary-identity.vo';
import { BequestCondition } from '../../../../domain/value-objects/bequest-condition.vo';
import { MoneyVO } from '../../../../domain/value-objects/money.vo';
import { AddBeneficiaryCommand } from '../impl/add-beneficiary.command';

@CommandHandler(AddBeneficiaryCommand)
export class AddBeneficiaryHandler implements ICommandHandler<AddBeneficiaryCommand> {
  private readonly logger = new Logger(AddBeneficiaryHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(command: AddBeneficiaryCommand): Promise<Result<void>> {
    const { willId, userId, data, correlationId } = command;

    this.logger.log(
      `Adding beneficiary to Will ${willId} for User ${userId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Load Aggregate
      const will = await this.willRepository.findById(new UniqueEntityID(willId));
      if (!will) {
        return Result.fail(new AppErrors.NotFoundError('Will', willId));
      }

      // 2. Security Check
      if (will.testatorId !== userId) {
        return Result.fail(new AppErrors.SecurityError('You can only modify your own will.'));
      }

      // 3. Map Beneficiary Identity VO
      const identityVO = this.createBeneficiaryIdentity(data.beneficiary);

      // 4. Map Money VO (if applicable)
      let fixedAmountVO: MoneyVO | undefined;
      if (data.bequestType === 'FIXED_AMOUNT' && data.fixedAmount) {
        fixedAmountVO = MoneyVO.createKES(data.fixedAmount);
      }

      // 5. Map Conditions
      const conditions: BequestCondition[] = (data.conditions || []).map((c) =>
        this.createCondition(c.type, c.parameter),
      );

      // 6. Create Bequest Entity
      const bequest = WillBequest.create({
        willId: will.id.toString(),
        beneficiary: identityVO,
        bequestType: data.bequestType,
        description: data.description,
        priority: data.priority || 'PRIMARY',

        // Value Specifications
        percentage: data.percentage,
        specificAssetId: data.specificAssetId,
        fixedAmount: fixedAmountVO,
        residuaryShare: data.residuaryShare,

        conditions: conditions,
        executionOrder: will.bequests.length + 1, // Simple auto-increment order

        // Defaults
        isVested: false,
        isSubjectToHotchpot: false,
        isValid: true,
        validationErrors: [],
      });

      // 7. Invoke Aggregate (Validation happens here: Status check + Contradiction check)
      will.addBequest(bequest);

      // 8. Persist
      await this.willRepository.save(will);

      this.logger.log(`Bequest added successfully to Will ${willId}`);
      return Result.ok();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to add beneficiary to Will ${willId}. Error: ${errorMessage}`,
        stack,
      );

      return Result.fail(error instanceof Error ? error : new Error(errorMessage));
    }
  }

  // --- Helper Methods to keep clean logic ---

  private createBeneficiaryIdentity(dto: any): BeneficiaryIdentity {
    if (dto.type === 'USER') {
      return BeneficiaryIdentity.createUser(dto.userId);
    }
    if (dto.type === 'FAMILY_MEMBER') {
      return BeneficiaryIdentity.createFamilyMember(dto.familyMemberId);
    }
    return BeneficiaryIdentity.createExternal(
      dto.externalDetails.name,
      dto.externalDetails.nationalId,
      dto.externalDetails.kraPin,
      dto.externalDetails.relationship,
    );
  }

  private createCondition(type: string, param: any): BequestCondition {
    switch (type) {
      case 'AGE_REQUIREMENT':
        return BequestCondition.ageRequirement(Number(param));
      case 'SURVIVAL':
        return BequestCondition.survivalCondition(Number(param));
      case 'EDUCATION':
        return BequestCondition.educationCondition(String(param));
      case 'MARRIAGE':
        return BequestCondition.marriageCondition(Boolean(param));
      case 'NONE':
        return BequestCondition.none();
      default:
        // Fallback for unknown/unsupported via factory
        return BequestCondition.none();
    }
  }
}
