// command-handlers/beneficiary/remove-beneficiary.handler.ts
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { RemoveBeneficiaryCommand } from '../../commands/beneficiary/remove-beneficiary.command';
import { BeneficiaryAssignmentRepository } from '../../../infrastructure/repositories/beneficiary-assignment.repository';
import { WillRepository } from '../../../infrastructure/repositories/will.repository';
import { BeneficiaryAssignmentNotFoundException } from '../../../domain/exceptions/beneficiary-assignment-not-found.exception';
import { WillNotFoundException } from '../../../domain/exceptions/will-not-found.exception';
import { Logger } from '@nestjs/common';

@CommandHandler(RemoveBeneficiaryCommand)
export class RemoveBeneficiaryHandler implements ICommandHandler<RemoveBeneficiaryCommand> {
  private readonly logger = new Logger(RemoveBeneficiaryHandler.name);

  constructor(
    private readonly beneficiaryAssignmentRepository: BeneficiaryAssignmentRepository,
    private readonly willRepository: WillRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RemoveBeneficiaryCommand): Promise<void> {
    const { beneficiaryAssignmentId, willId, data, correlationId } = command;
    this.logger.debug(`Executing RemoveBeneficiaryCommand: ${correlationId}`);

    // 1. Validate Will exists and is editable
    const will = await this.willRepository.findById(willId);
    if (!will) {
      throw new WillNotFoundException(willId);
    }

    if (!will.isEditable()) {
      throw new Error('Will is not editable');
    }

    // 2. Validate beneficiary belongs to will
    if (!will.beneficiaryIds.includes(beneficiaryAssignmentId)) {
      throw new Error(`Beneficiary ${beneficiaryAssignmentId} not found in will ${willId}`);
    }

    // 3. Load beneficiary assignment
    const beneficiaryAssignment = await this.beneficiaryAssignmentRepository.findById(beneficiaryAssignmentId);
    if (!beneficiaryAssignment) {
      throw new BeneficiaryAssignmentNotFoundException(beneficiaryAssignmentId);
    }

    // 4. Apply domain behavior
    beneficiaryAssignment.remove(data.reason);

    // 5. Remove from will aggregate
    will.removeBeneficiary(beneficiaryAssignmentId);

    // 6. Save changes
    await this.beneficiaryAssignmentRepository.save(beneficiaryAssignment);
    await this.willRepository.save(will);
    this.logger.debug(`Beneficiary removed: ${beneficiaryAssignmentId}`);

    // 7. Publish events
    this.publisher.mergeObjectContext(beneficiaryAssignment).commit();
    this.publisher.mergeObjectContext(will).commit();
  }
}
