import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import {
  DependantRelationship,
  LegalDependant,
} from '../../../../../domain/entities/legal-dependant.entity';
import { DependencyLevel } from '../../../../../domain/enums/dependency-level.enum';
import { KenyanLawSection } from '../../../../../domain/enums/kenyan-law-section.enum';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { FileDependantClaimCommand } from '../../impl/dependants/file-dependant-claim.command';

@CommandHandler(FileDependantClaimCommand)
export class FileDependantClaimHandler implements ICommandHandler<FileDependantClaimCommand> {
  private readonly logger = new Logger(FileDependantClaimHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: FileDependantClaimCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Filing dependant claim for ${dto.dependantName} in Estate ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      const monthlyNeeds = MoneyVO.create({
        amount: dto.monthlyMaintenanceNeeds.amount,
        currency: dto.monthlyMaintenanceNeeds.currency,
      });

      let dependant: LegalDependant;

      // Factory Logic based on Relationship Type
      if (dto.relationship === DependantRelationship.SPOUSE) {
        dependant = LegalDependant.createSpouseDependant(
          dto.estateId,
          dto.deceasedId,
          dto.dependantId,
          dto.dependantName,
          monthlyNeeds,
          dto.isIncapacitated,
        );
      } else if (dto.relationship === DependantRelationship.CHILD && dto.dateOfBirth) {
        dependant = LegalDependant.createChildDependant(
          dto.estateId,
          dto.deceasedId,
          dto.dependantId,
          dto.dependantName,
          dto.dateOfBirth,
          monthlyNeeds,
          dto.custodialParentId,
        );
      } else {
        // Generic Factory for S.29(b) Dependants (Parents, Siblings, etc.)
        dependant = LegalDependant.create({
          estateId: dto.estateId,
          deceasedId: dto.deceasedId,
          dependantId: dto.dependantId,
          dependantName: dto.dependantName,
          relationship: dto.relationship,
          lawSection: KenyanLawSection.S29_DEPENDANTS, // Default
          dependencyLevel: DependencyLevel.PARTIAL, // Default assumption, can be adjusted
          isMinor: false, // Calculated inside if DOB provided, but explicit here
          isIncapacitated: dto.isIncapacitated,
          hasDisability: dto.hasDisability,
          monthlyMaintenanceNeeds: monthlyNeeds,
          custodialParentId: dto.custodialParentId,
          guardianId: dto.guardianId,
          dateOfBirth: dto.dateOfBirth,
        });
      }

      // Add to Estate Aggregate
      // Triggers risk analysis checks within the aggregate
      estate.addDependant(dependant, dto.filedBy);

      await this.estateRepository.save(estate);

      this.logger.log(`Dependant claim filed successfully. ID: ${dependant.id.toString()}`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to file claim: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
