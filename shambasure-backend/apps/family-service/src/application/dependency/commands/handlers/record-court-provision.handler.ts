// application/dependency/commands/handlers/record-court-provision.handler.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { DependencyAssessmentAggregate } from '../../../../domain/aggregates/dependency-assessment.aggregate';
import { LegalDependant } from '../../../../domain/entities/legal-dependant.entity';
import { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { RecordCourtProvisionCommand } from '../impl/record-court-provision.command';
import { BaseCommandHandler, CommandHandlerResult } from './base.handler';

@Injectable()
export class RecordCourtProvisionHandler extends BaseCommandHandler<RecordCourtProvisionCommand> {
  constructor(
    repository: ILegalDependantRepository,
    eventPublisher: EventPublisher,
    private readonly mapper: DependencyMapper,
  ) {
    super(repository, eventPublisher);
  }

  async execute(command: RecordCourtProvisionCommand): Promise<CommandHandlerResult> {
    const startTime = Date.now();

    try {
      // 1. Validate command
      const validation = command.validate();
      if (!validation.isValid) {
        return this.createErrorResult(
          'Command validation failed',
          command,
          validation.errors,
          validation.warnings,
        );
      }

      // 2. Check permissions - only court officials can record provisions
      const permissionCheck = this.checkPermission(command.metadata, 'RECORD_COURT_PROVISION');
      if (!permissionCheck.hasPermission) {
        throw new ForbiddenException(permissionCheck.reason);
      }

      // 3. Load existing dependency
      const existingDependant = await this.repository.findById(command.dependencyAssessmentId);

      if (!existingDependant) {
        throw new NotFoundException(
          `Dependency assessment not found with ID: ${command.dependencyAssessmentId}`,
        );
      }

      // 4. Validate dependency has a pending S.26 claim (if applicable)
      if (command.legalSection === 'S26' && !existingDependant.isClaimant) {
        throw new BadRequestException(
          'Cannot record S.26 court provision for a dependant without a pending S.26 claim.',
        );
      }

      // 5. Check if provision already exists
      if (existingDependant.hasCourtOrder) {
        const existingOrderNumber = existingDependant['provisionOrderNumber'];
        throw new BadRequestException(
          `Court provision already recorded with order number: ${existingOrderNumber}. Use update instead.`,
        );
      }

      // 6. Validate order date is not in the future
      if (command.orderDate > new Date()) {
        throw new BadRequestException('Order date cannot be in the future.');
      }

      // 7. Begin transaction
      await this.beginTransaction();

      try {
        // 8. Update domain entity
        const aggregate = DependencyAssessmentAggregate.createFromProps(existingDependant.toJSON());

        // Record court provision
        aggregate.recordCourtProvision({
          orderNumber: command.orderNumber,
          approvedAmount: command.approvedAmount,
          provisionType: command.provisionType,
          orderDate: command.orderDate,
        });

        // 9. Add additional provision details
        this.addProvisionDetails(aggregate, command);

        // 10. Verify evidence if provision is approved
        if (command.approvedAmount > 0) {
          aggregate.verifyEvidence(command.metadata.userId, 'COURT_ORDER_VERIFICATION');
        }

        // 11. Publish events
        this.eventPublisher.mergeObjectContext(aggregate);

        // 12. Convert to entity and save
        const updatedEntity = LegalDependant.createFromProps(aggregate.toJSON());
        const savedDependant = await this.repository.update(updatedEntity);

        // 13. Commit aggregate changes
        aggregate.commit();

        // 14. Commit transaction
        await this.commitTransaction();

        // 15. Map to response
        const response = this.mapper.toDependencyAssessmentResponse(savedDependant);

        // 16. Log success
        this.logCommandExecution(command, Date.now() - startTime, true);

        // 17. Trigger provision execution workflow
        await this.triggerProvisionWorkflow(command, savedDependant);

        return this.createSuccessResult(
          response,
          'Court provision recorded successfully',
          command,
          validation.warnings,
        );
      } catch (error) {
        await this.rollbackTransaction(error);
        throw error;
      }
    } catch (error) {
      this.logCommandExecution(command, Date.now() - startTime, false, error);

      if (error instanceof NotFoundException) {
        return this.createErrorResult(
          error.message,
          command,
          ['DEPENDENCY_NOT_FOUND'],
          command.validate().warnings,
        );
      }

      if (error instanceof ForbiddenException) {
        return this.createErrorResult(
          error.message,
          command,
          ['PERMISSION_DENIED'],
          command.validate().warnings,
        );
      }

      if (error instanceof BadRequestException) {
        return this.createErrorResult(
          error.message,
          command,
          ['INVALID_PROVISION'],
          command.validate().warnings,
        );
      }

      return this.createErrorResult(
        `Failed to record court provision: ${error.message}`,
        command,
        ['EXECUTION_ERROR'],
        command.validate().warnings,
      );
    }
  }

  private addProvisionDetails(
    aggregate: DependencyAssessmentAggregate,
    command: RecordCourtProvisionCommand,
  ): void {
    // Add additional provision details not covered by aggregate method
    const props = aggregate['props'];

    // Store court details
    props['courtName'] = command.courtName;
    props['judgeName'] = command.judgeName;
    props['caseNumber'] = command.caseNumber;

    // Store payment details
    props['paymentSchedule'] = command.paymentSchedule;
    props['firstPaymentDate'] = command.firstPaymentDate;
    props['numberOfInstallments'] = command.numberOfInstallments;
    props['bankAccountDetails'] = command.bankAccountDetails;
    props['installmentSchedule'] = command.installmentSchedule;
    props['propertyDetails'] = command.propertyDetails;

    // Store legal and monitoring details
    props['legalSection'] = command.legalSection;
    props['conditions'] = command.conditions;
    props['nextReviewDate'] = command.nextReviewDate;
    props['monitoringOfficer'] = command.monitoringOfficer;
    props['isAppealable'] = command.isAppealable;
    props['appealDeadline'] = command.appealDeadline;

    // Update audit fields
    props['version'] += 1;
    props['updatedAt'] = new Date();
  }

  private async triggerProvisionWorkflow(
    command: RecordCourtProvisionCommand,
    dependant: LegalDependant,
  ): Promise<void> {
    try {
      // Trigger workflows based on provision type
      switch (command.provisionType) {
        case 'MONTHLY_ALLOWANCE':
          await this.scheduleMonthlyPayments(command, dependant);
          break;
        case 'PROPERTY_TRANSFER':
          await this.initiatePropertyTransfer(command, dependant);
          break;
        case 'TRUST_FUND':
          await this.setupTrustFund(command, dependant);
          break;
        case 'EDUCATION_FUND':
          await this.setupEducationFund(command, dependant);
          break;
      }

      // Notify all parties
      await this.notifyParties(command, dependant);

      // Schedule monitoring if required
      if (command.requiresMonitoring) {
        await this.scheduleMonitoring(command, dependant);
      }

      this.logger.log(`Provision workflow triggered for order ${command.orderNumber}`);
    } catch (error) {
      this.logger.error('Failed to trigger provision workflow', error.stack);
      // Log but don't fail the command
    }
  }

  private async scheduleMonthlyPayments(
    command: RecordCourtProvisionCommand,
    dependant: LegalDependant,
  ): Promise<void> {
    // Schedule monthly payments with payment processor
    this.logger.log(`Scheduling ${command.numberOfInstallments || 12} monthly payments`);

    // Implementation would integrate with payment processing system
  }

  private async initiatePropertyTransfer(
    command: RecordCourtProvisionCommand,
    dependant: LegalDependant,
  ): Promise<void> {
    // Initiate property transfer process
    this.logger.log(`Initiating property transfer: ${command.propertyDetails}`);

    // Implementation would integrate with land registry system
  }

  private async setupTrustFund(
    command: RecordCourtProvisionCommand,
    dependant: LegalDependant,
  ): Promise<void> {
    // Setup trust fund with financial institution
    this.logger.log(`Setting up trust fund for amount ${command.approvedAmount}`);

    // Implementation would integrate with trust management system
  }

  private async setupEducationFund(
    command: RecordCourtProvisionCommand,
    dependant: LegalDependant,
  ): Promise<void> {
    // Setup education fund with school/university
    this.logger.log(`Setting up education fund for dependant ${dependant.dependantId}`);

    // Implementation would integrate with educational institutions
  }

  private async notifyParties(
    command: RecordCourtProvisionCommand,
    dependant: LegalDependant,
  ): Promise<void> {
    // Notify all interested parties about the court provision
    const parties = [
      'dependant', // The dependant receiving provision
      'legal_representative', // Lawyer if any
      'estate_executor', // Executor of the deceased's estate
      'court_registry', // Court records
    ];

    this.logger.log(`Notifying parties about court provision ${command.orderNumber}`);

    // Implementation would send notifications via email, SMS, or internal messaging
  }

  private async scheduleMonitoring(
    command: RecordCourtProvisionCommand,
    dependant: LegalDependant,
  ): Promise<void> {
    // Schedule periodic monitoring and review
    const monitoringTasks = [
      {
        task: 'REVIEW_COMPLIANCE',
        dueDate: command.nextReviewDate || this.calculateNextReviewDate(command.orderDate),
        assignedTo: command.monitoringOfficer || command.metadata.userId,
      },
    ];

    this.logger.log(`Scheduled monitoring for provision ${command.orderNumber}`);

    // Implementation would schedule tasks in a task management system
  }

  private calculateNextReviewDate(orderDate: Date): Date {
    const nextReview = new Date(orderDate);
    nextReview.setMonth(nextReview.getMonth() + 6); // Default 6-month review
    return nextReview;
  }
}
