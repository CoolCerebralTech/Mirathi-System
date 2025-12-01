// command-handlers/beneficiary/obtain-court-approval.handler.ts
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { ObtainCourtApprovalCommand } from '../../commands/beneficiary/obtain-court-approval.command';
import { BeneficiaryAssignmentRepository } from '../../../infrastructure/repositories/beneficiary-assignment.repository';
import { BeneficiaryAssignmentNotFoundException } from '../../../domain/exceptions/beneficiary-assignment-not-found.exception';
import { CourtApprovalNotRequiredException } from '../../../domain/exceptions/court-approval-not-required.exception';
import { Logger } from '@nestjs/common';

@CommandHandler(ObtainCourtApprovalCommand)
export class ObtainCourtApprovalHandler implements ICommandHandler<ObtainCourtApprovalCommand> {
  private readonly logger = new Logger(ObtainCourtApprovalHandler.name);

  constructor(
    private readonly beneficiaryAssignmentRepository: BeneficiaryAssignmentRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: ObtainCourtApprovalCommand): Promise<void> {
    const { beneficiaryAssignmentId, willId, data, correlationId } = command;
    this.logger.debug(`Executing ObtainCourtApprovalCommand: ${correlationId}`);

    // 1. Load beneficiary assignment
    const beneficiaryAssignment = await this.beneficiaryAssignmentRepository.findById(beneficiaryAssignmentId);
    if (!beneficiaryAssignment) {
      throw new BeneficiaryAssignmentNotFoundException(beneficiaryAssignmentId);
    }

    // 2. Validate beneficiary belongs to will
    if (beneficiaryAssignment.willId !== willId) {
      throw new Error(`Beneficiary ${beneficiaryAssignmentId} does not belong to will ${willId}`);
    }

    // 3. Check if court approval is required
    if (!beneficiaryAssignment.courtApprovalRequired) {
      throw new CourtApprovalNotRequiredException(beneficiaryAssignmentId);
    }

    // 4. Apply domain behavior
    beneficiaryAssignment.obtainCourtApproval(data.approvalDate, data.courtOrderNumber);

    // 5. Save changes
    await this.beneficiaryAssignmentRepository.save(beneficiaryAssignment);
    this.logger.debug(`Court approval obtained for beneficiary: ${beneficiaryAssignmentId}`);

    // 6. Publish events
    this.publisher.mergeObjectContext(beneficiaryAssignment).commit();
  }
}
