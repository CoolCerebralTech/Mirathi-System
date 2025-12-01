// command-handlers/beneficiary/require-court-approval.handler.ts
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { RequireCourtApprovalCommand } from '../../commands/beneficiary/require-court-approval.command';
import { BeneficiaryAssignmentRepository } from '../../../infrastructure/repositories/beneficiary-assignment.repository';
import { WillRepository } from '../../../infrastructure/repositories/will.repository';
import { BeneficiaryAssignmentNotFoundException } from '../../../domain/exceptions/beneficiary-assignment-not-found.exception';
import { WillNotFoundException } from '../../../domain/exceptions/will-not-found.exception';
import { Logger } from '@nestjs/common';

@CommandHandler(RequireCourtApprovalCommand)
export class RequireCourtApprovalHandler implements ICommandHandler<RequireCourtApprovalCommand> {
  private readonly logger = new Logger(RequireCourtApprovalHandler.name);

  constructor(
    private readonly beneficiaryAssignmentRepository: BeneficiaryAssignmentRepository,
    private readonly willRepository: WillRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RequireCourtApprovalCommand): Promise<void> {
    const { beneficiaryAssignmentId, willId, data, correlationId } = command;
    this.logger.debug(`Executing RequireCourtApprovalCommand: ${correlationId}`);

    // 1. Validate Will exists
    const will = await this.willRepository.findById(willId);
    if (!will) {
      throw new WillNotFoundException(willId);
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
    beneficiaryAssignment.requireCourtApproval(data.reason);

    // 5. Save changes
    await this.beneficiaryAssignmentRepository.save(beneficiaryAssignment);
    this.logger.debug(`Court approval required for beneficiary: ${beneficiaryAssignmentId}`);

    // 6. Publish events
    this.publisher.mergeObjectContext(beneficiaryAssignment).commit();
  }
}
