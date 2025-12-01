// command-handlers/beneficiary/add-beneficiary-condition.handler.ts
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { AddBeneficiaryConditionCommand } from '../../commands/beneficiary/add-beneficiary-condition.command';
import { BeneficiaryAssignmentRepository } from '../../../infrastructure/repositories/beneficiary-assignment.repository';
import { WillRepository } from '../../../infrastructure/repositories/will.repository';
import { BeneficiaryAssignmentNotFoundException } from '../../../domain/exceptions/beneficiary-assignment-not-found.exception';
import { WillNotFoundException } from '../../../domain/exceptions/will-not-found.exception';
import { Logger } from '@nestjs/common';

@CommandHandler(AddBeneficiaryConditionCommand)
export class AddBeneficiaryConditionHandler implements ICommandHandler<AddBeneficiaryConditionCommand> {
  private readonly logger = new Logger(AddBeneficiaryConditionHandler.name);

  constructor(
    private readonly beneficiaryAssignmentRepository: BeneficiaryAssignmentRepository,
    private readonly willRepository: WillRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: AddBeneficiaryConditionCommand): Promise<void> {
    const { beneficiaryAssignmentId, willId, data, correlationId } = command;
    this.logger.debug(`Executing AddBeneficiaryConditionCommand: ${correlationId}`);

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
    beneficiaryAssignment.addCondition(
      data.conditionType,
      data.conditionDetails,
      data.conditionDeadline,
    );

    // 5. Save changes
    await this.beneficiaryAssignmentRepository.save(beneficiaryAssignment);
    this.logger.debug(`Condition added to beneficiary: ${beneficiaryAssignmentId}`);

    // 6. Publish events
    this.publisher.mergeObjectContext(beneficiaryAssignment).commit();
  }
}
