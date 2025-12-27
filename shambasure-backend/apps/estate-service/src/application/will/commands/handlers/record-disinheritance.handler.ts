import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../../application/common/application.error';
import { Result } from '../../../../application/common/result';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { DisinheritanceRecord } from '../../../../domain/entities/disinheritance-record.entity';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { BeneficiaryIdentity } from '../../../../domain/value-objects/beneficiary-identity.vo';
import { RecordDisinheritanceCommand } from '../impl/record-disinheritance.command';

@CommandHandler(RecordDisinheritanceCommand)
export class RecordDisinheritanceHandler implements ICommandHandler<RecordDisinheritanceCommand> {
  private readonly logger = new Logger(RecordDisinheritanceHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(command: RecordDisinheritanceCommand): Promise<Result<void>> {
    const { willId, userId, data, correlationId } = command;

    this.logger.log(
      `Recording disinheritance in Will ${willId} for User ${userId} [CorrelationID: ${correlationId}]`,
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

      // 3. Map Identity VO
      const identityVO = this.createPersonIdentity(data.disinheritedPerson);

      // 4. Calculate Preliminary Risk Level (Logic helper)
      // We calculate this here to populate the entity props correctly.
      const riskAssessment = this.assessRisk(data.reasonCategory, data.evidence.length);
      const mitigationSteps =
        data.riskMitigationSteps && data.riskMitigationSteps.length > 0
          ? data.riskMitigationSteps
          : riskAssessment.defaultMitigation;

      // 5. Create Disinheritance Entity
      const record = DisinheritanceRecord.create({
        willId: will.id.toString(),
        disinheritedPerson: identityVO,

        reasonCategory: data.reasonCategory,
        reasonDescription: data.reasonDescription,
        legalBasis: data.legalBasis,

        evidence: data.evidence,

        isCompleteDisinheritance: data.isCompleteDisinheritance,
        appliesToBequests: data.appliesToBequests || [],

        // Initial state
        isAcknowledgedByDisinherited: false,
        isActive: true,

        // Risk Profile (Calculated above)
        legalRiskLevel: riskAssessment.level,
        riskMitigationSteps: mitigationSteps,
      });

      // 6. Invoke Aggregate (Validates contradictions with Bequests)
      will.addDisinheritanceRecord(record);

      // 7. Persistence
      await this.willRepository.save(will);

      this.logger.log(
        `Disinheritance record added for ${identityVO.getDisplayName()}. Risk Level: ${riskAssessment.level}`,
      );

      return Result.ok();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to record disinheritance in Will ${willId}. Error: ${errorMessage}`,
        stack,
      );

      return Result.fail(error instanceof Error ? error : new Error(errorMessage));
    }
  }

  // --- Helper: Identity Factory ---
  private createPersonIdentity(dto: any): BeneficiaryIdentity {
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

  // --- Helper: Basic Risk Assessor ---
  // Mirrors domain logic slightly to ensure valid entity creation props
  private assessRisk(
    category: string,
    evidenceCount: number,
  ): {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    defaultMitigation: string[];
  } {
    // High Risk Categories
    if (category === 'TESTATOR_DISCRETION' || category === 'MORAL_UNWORTHINESS') {
      return {
        level: 'HIGH',
        defaultMitigation: [
          'Detailed Affidavit of reasons',
          'No-contest clause',
          'Video evidence of intent',
        ],
      };
    }

    // Medium Risk
    if (category === 'ESTRANGEMENT' && evidenceCount < 2) {
      return {
        level: 'MEDIUM',
        defaultMitigation: ['Document lack of contact', 'Explain reasons in separate letter'],
      };
    }

    // Low Risk
    return {
      level: 'LOW',
      defaultMitigation: ['Clear statement in will'],
    };
  }
}
