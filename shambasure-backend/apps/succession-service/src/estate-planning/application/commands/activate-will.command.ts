import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { WillValidationService } from '../../domain/services/will-validation.service';

export class ActivateWillCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(ActivateWillCommand)
export class ActivateWillHandler implements ICommandHandler<ActivateWillCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly validationService: WillValidationService,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: ActivateWillCommand): Promise<void> {
    const { willId, userId } = command;

    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException(`Will ${willId} not found.`);

    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Ownership mismatch.');
    }

    // 1. Run Domain Validation Service (Policies)
    // This checks Asset Rules, Witness Conflicts, etc.
    const validation = this.validationService.validateWill(aggregate);

    if (!validation.isValid || !validation.isLegallyCompliant) {
      throw new BadRequestException({
        message: 'Will validation failed.',
        errors: validation.criticalErrors,
        warnings: validation.warnings,
      });
    }

    // 2. Check for Supersession (Optional Logic)
    // If there is already an active will, we might need to mark it as superseded here,
    // or the Entity logic handles the status transition.
    const existingActive = await this.willRepository.findActiveWillByTestatorId(userId);

    const willModel = this.publisher.mergeObjectContext(aggregate);

    if (existingActive && existingActive.getWill().getId() !== willId) {
      // Logic: Supersede the old one.
      // In a real transaction, we would update 'existingActive' to SUPERSEDED here.
      // For now, we proceed to activate the new one, which implies priority by date.
    }

    // 3. Activate
    willModel.activate(userId);

    // 4. Save
    await this.willRepository.save(willModel);
    willModel.commit();
  }
}
