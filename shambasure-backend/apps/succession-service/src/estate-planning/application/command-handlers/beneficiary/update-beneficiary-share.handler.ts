// command-handlers/beneficiary/update-beneficiary-share.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { BeneficiaryAssignmentNotFoundException } from '../../../domain/exceptions/beneficiary-assignment-not-found.exception';
import { BeneficiaryNotEditableException } from '../../../domain/exceptions/beneficiary-not-editable.exception';
import { WillNotFoundException } from '../../../domain/exceptions/will-not-found.exception';
import { BeneficiaryAssignmentRepository } from '../../../infrastructure/repositories/beneficiary-assignment.repository';
import { WillRepository } from '../../../infrastructure/repositories/will.repository';
import { UpdateBeneficiaryShareCommand } from '../../commands/beneficiary/update-beneficiary-share.command';

@CommandHandler(UpdateBeneficiaryShareCommand)
export class UpdateBeneficiaryShareHandler implements ICommandHandler<UpdateBeneficiaryShareCommand> {
  private readonly logger = new Logger(UpdateBeneficiaryShareHandler.name);

  constructor(
    private readonly beneficiaryAssignmentRepository: BeneficiaryAssignmentRepository,
    private readonly willRepository: WillRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdateBeneficiaryShareCommand): Promise<void> {
    const { beneficiaryAssignmentId, willId, data, correlationId } = command;
    this.logger.debug(`Executing UpdateBeneficiaryShareCommand: ${correlationId}`);

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
    const beneficiaryAssignment =
      await this.beneficiaryAssignmentRepository.findById(beneficiaryAssignmentId);
    if (!beneficiaryAssignment) {
      throw new BeneficiaryAssignmentNotFoundException(beneficiaryAssignmentId);
    }

    // 4. Validate beneficiary assignment belongs to will
    if (beneficiaryAssignment.willId !== willId) {
      throw new Error(`Beneficiary ${beneficiaryAssignmentId} does not belong to will ${willId}`);
    }

    // 5. Apply domain behavior based on bequest type
    if (data.bequestType === 'PERCENTAGE' || data.bequestType === 'RESIDUARY') {
      if (data.sharePercent !== undefined) {
        beneficiaryAssignment.updateSharePercentage(data.sharePercent);
      }
    } else if (data.bequestType === 'SPECIFIC') {
      if (data.specificAmount !== undefined) {
        beneficiaryAssignment.updateSpecificAmount(data.specificAmount);
      }
    }

    // 6. Save changes
    await this.beneficiaryAssignmentRepository.save(beneficiaryAssignment);
    this.logger.debug(`Beneficiary share updated: ${beneficiaryAssignmentId}`);

    // 7. Publish events
    this.publisher.mergeObjectContext(beneficiaryAssignment).commit();
  }
}
