import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { UploadClearanceCertificateCommand } from '../../impl/tax/upload-clearance-certificate.command';

@CommandHandler(UploadClearanceCertificateCommand)
export class UploadClearanceCertificateHandler implements ICommandHandler<UploadClearanceCertificateCommand> {
  private readonly logger = new Logger(UploadClearanceCertificateHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: UploadClearanceCertificateCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Uploading Tax Clearance for Estate ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      // Domain Logic
      // Accessing the child entity via the Aggregate Root
      // The Entity validates that balance is zero before allowing clearance
      estate.taxCompliance.markAsCleared(dto.certificateNumber, dto.uploadedBy, dto.clearanceDate);

      await this.estateRepository.save(estate);

      this.logger.log(`Tax Clearance Certificate recorded successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to upload tax clearance: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
