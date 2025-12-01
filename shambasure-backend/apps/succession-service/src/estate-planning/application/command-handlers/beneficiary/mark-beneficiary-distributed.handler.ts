// command-handlers/beneficiary/mark-beneficiary-distributed.handler.ts
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { MarkBeneficiaryDistributedCommand } from '../../commands/beneficiary/mark-beneficiary-distributed.command';
import { BeneficiaryAssignmentRepository } from '../../../infrastructure/repositories/beneficiary-assignment.repository';
import { EstateRepository } from '../../../infrastructure/repositories/estate.repository';
import { BeneficiaryAssignmentNotFoundException } from '../../../domain/exceptions/beneficiary-assignment-not-found.exception';
import { EstateNotFoundException } from '../../../domain/exceptions/estate-not-found.exception';
import { BeneficiaryCannotBeDistributedException } from '../../../domain/exceptions/beneficiary-cannot-be-distributed.exception';
import { Logger } from '@nestjs/common';

@CommandHandler(MarkBeneficiaryDistributedCommand)
export class MarkBeneficiaryDistributedHandler implements ICommandHandler<MarkBeneficiaryDistributedCommand> {
  private readonly logger = new Logger(MarkBeneficiaryDistributedHandler.name);

  constructor(
    private readonly beneficiaryAssignmentRepository: BeneficiaryAssignmentRepository,
    private readonly estateRepository: EstateRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: MarkBeneficiaryDistributedCommand): Promise<void> {
    const { beneficiaryAssignmentId, willId, data, correlationId } = command;
    this.logger.debug(`Executing MarkBeneficiaryDistributedCommand: ${correlationId}`);

    // 1. Load beneficiary assignment
    const beneficiaryAssignment = await this.beneficiaryAssignmentRepository.findById(beneficiaryAssignmentId);
    if (!beneficiaryAssignment) {
      throw new BeneficiaryAssignmentNotFoundException(beneficiaryAssignmentId);
    }

    // 2. Validate beneficiary belongs to will
    if (beneficiaryAssignment.willId !== willId) {
      throw new Error(`Beneficiary ${beneficiaryAssignmentId} does not belong to will ${willId}`);
    }

    // 3. Check if beneficiary can be distributed (domain logic)
    if (!beneficiaryAssignment.canBeDistributed()) {
      throw new BeneficiaryCannotBeDistributedException(beneficiaryAssignmentId);
    }

    // 4. Check court approval if required
    if (beneficiaryAssignment.courtApprovalRequired && !beneficiaryAssignment.courtApprovalObtained) {
      throw new Error('Court approval required before distribution');
    }

    // 5. Check conditions if any
    if (beneficiaryAssignment.isConditional() && !beneficiaryAssignment.isConditionMet()) {
      throw new Error('Condition must be met before distribution');
    }

    // 6. Apply domain behavior
    beneficiaryAssignment.markAsDistributed(data.distributionMethod, data.distributionNotes);

    // 7. Save changes
    await this.beneficiaryAssignmentRepository.save(beneficiaryAssignment);
    this.logger.debug(`Beneficiary marked as distributed: ${beneficiaryAssignmentId}`);

    // 8. If this beneficiary is part of an estate, update estate status
    // This would require linking will to estate and checking if all beneficiaries are distributed
    // For now, we just save the beneficiary

    // 9. Publish events
    this.publisher.mergeObjectContext(beneficiaryAssignment).commit();
  }
}
