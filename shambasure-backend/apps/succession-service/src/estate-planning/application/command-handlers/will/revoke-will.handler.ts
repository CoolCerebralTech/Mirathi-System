// revoke-will.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { EstatePlanningRepository } from '../../infrastructure/repositories/estate-planning.repository';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { RevokeWillCommand } from './revoke-will.command';

@CommandHandler(RevokeWillCommand)
export class RevokeWillHandler implements ICommandHandler<RevokeWillCommand> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(command: RevokeWillCommand): Promise<void> {
    const { willId, testatorId, data } = command;

    this.logger.debug(`Revoking will ${willId}`);

    // Load the Will aggregate
    const will = await this.willRepository.findById(willId);
    if (!will) {
      this.logger.warn(`Will ${willId} not found`);
      throw new Error(`Will ${willId} not found`);
    }

    // Verify testator ownership
    if (will.testatorId !== testatorId) {
      this.logger.warn(`Testator ${testatorId} does not own will ${willId}`);
      throw new Error('Unauthorized will revocation');
    }

    // Reconstruct aggregate
    const willAggregate = this.publisher.mergeObjectContext(
      WillAggregate.reconstitute(
        will,
        will.assetIds,
        will.beneficiaryIds,
        will.executorIds,
        will.witnessIds,
      ),
    );

    // Revoke will through aggregate
    willAggregate.revoke(data.revokedBy, data.revocationReason, data.revocationMethod);

    // Load estate planning aggregate to clear active will if this was the active one
    const estatePlanning = await this.estatePlanningRepository.findByUserId(testatorId);
    if (estatePlanning && estatePlanning.getActiveWillId() === willId) {
      estatePlanning.clearActiveWill();
      await this.estatePlanningRepository.save(estatePlanning);
    }

    // Save updated will
    await this.willRepository.save(willAggregate.getWill());

    // Commit events
    willAggregate.commit();

    this.logger.log(`Will ${willId} revoked successfully`);
  }
}
