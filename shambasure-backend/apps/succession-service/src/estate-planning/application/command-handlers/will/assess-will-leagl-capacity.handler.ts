// assess-will-legal-capacity.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { LegalCapacityAssessment } from '../../domain/entities/will.entity';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { AssessWillLegalCapacityCommand } from './assess-will-legal-capacity.command';

@CommandHandler(AssessWillLegalCapacityCommand)
export class AssessWillLegalCapacityHandler implements ICommandHandler<AssessWillLegalCapacityCommand> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(command: AssessWillLegalCapacityCommand): Promise<void> {
    const { willId, testatorId, data } = command;

    this.logger.debug(`Assessing legal capacity for will ${willId}`);

    // Load the Will aggregate
    const will = await this.willRepository.findById(willId);
    if (!will) {
      this.logger.warn(`Will ${willId} not found`);
      throw new Error(`Will ${willId} not found`);
    }

    // Verify testator ownership
    if (will.testatorId !== testatorId) {
      this.logger.warn(`Testator ${testatorId} does not own will ${willId}`);
      throw new Error('Unauthorized legal capacity assessment');
    }

    // Reconstruct aggregate
    const willAggregate = this.publisher.mergeObjectContext(
      WillAggregate.reconstitute(
        will,
        will.assetIds,
        will.beneficiaryIds,
        will.executorIds,
        will.witnessIds,
      ),
    );

    // Create legal capacity assessment
    const assessment: LegalCapacityAssessment = {
      isOfAge: data.assessment.isOfAge,
      isSoundMind: data.assessment.isSoundMind,
      understandsWillNature: data.assessment.understandsWillNature,
      understandsAssetExtent: data.assessment.understandsAssetExtent,
      understandsBeneficiaryClaims: data.assessment.understandsBeneficiaryClaims,
      freeFromUndueInfluence: data.assessment.freeFromUndueInfluence,
      assessmentDate: data.assessment.assessmentDate,
      assessedBy: data.assessment.assessedBy,
      medicalCertificationId: data.assessment.medicalCertificationId,
      assessmentNotes: data.assessment.assessmentNotes,
    };

    // Assess legal capacity through Will entity
    willAggregate
      .getWill()
      .assessLegalCapacity(assessment, data.assessedBy, data.legalCapacityStatus);

    // Save updated will
    await this.willRepository.save(willAggregate.getWill());

    // Commit events
    willAggregate.commit();

    this.logger.log(
      `Legal capacity assessed for will ${willId}, status: ${data.legalCapacityStatus}`,
    );
  }
}
