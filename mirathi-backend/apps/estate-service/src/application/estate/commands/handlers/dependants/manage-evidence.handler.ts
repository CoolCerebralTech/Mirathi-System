import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { DependantEvidence } from '../../../../../domain/entities/dependant-evidence.entity';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import {
  AddDependantEvidenceCommand,
  VerifyDependantEvidenceCommand,
} from '../../impl/dependants/manage-evidence.command';

@CommandHandler(AddDependantEvidenceCommand)
export class AddDependantEvidenceHandler implements ICommandHandler<AddDependantEvidenceCommand> {
  private readonly logger = new Logger(AddDependantEvidenceHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: AddDependantEvidenceCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;
    this.logger.log(
      `Adding evidence for Dependant ${dto.dependantId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found: ${dto.estateId}`));

      const dependant = estate.dependants.find((d) => d.id.toString() === dto.dependantId);
      if (!dependant) return Result.fail(new Error(`Dependant not found: ${dto.dependantId}`));

      // Factory Logic based on type (Simplified generic create for brevity, but could use specific factories)
      const evidence = DependantEvidence.create({
        dependantId: dto.dependantId,
        type: dto.type,
        documentUrl: dto.documentUrl,
        description: dto.description,
        uploadedBy: dto.uploadedBy,
      });

      dependant.addEvidence(evidence, dto.uploadedBy);

      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to add evidence: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

@CommandHandler(VerifyDependantEvidenceCommand)
export class VerifyDependantEvidenceHandler implements ICommandHandler<VerifyDependantEvidenceCommand> {
  private readonly logger = new Logger(VerifyDependantEvidenceHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: VerifyDependantEvidenceCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;
    this.logger.log(`Verifying evidence ${dto.evidenceId} [CorrelationID: ${correlationId}]`);

    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const dependant = estate.dependants.find((d) => d.id.toString() === dto.dependantId);
      if (!dependant) return Result.fail(new Error(`Dependant not found`));

      dependant.verifyEvidence(dto.evidenceId, dto.verifiedBy, dto.verificationNotes);

      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to verify evidence: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
