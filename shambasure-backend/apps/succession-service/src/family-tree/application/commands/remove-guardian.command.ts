import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { GuardianshipRepositoryInterface } from '../../domain/interfaces/guardianship.repository.interface';

export class RemoveGuardianCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly guardianshipId: string,
    public readonly reason: string,
  ) {}
}

@CommandHandler(RemoveGuardianCommand)
export class RemoveGuardianHandler implements ICommandHandler<RemoveGuardianCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('GuardianshipRepositoryInterface')
    private readonly guardianshipRepository: GuardianshipRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RemoveGuardianCommand): Promise<void> {
    const { familyId, userId, guardianshipId, reason } = command;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) {
      throw new BadRequestException('Access denied.');
    }

    // 2. Load Entity
    const guardianship = await this.guardianshipRepository.findById(guardianshipId);
    if (!guardianship) throw new NotFoundException('Guardianship record not found.');

    // 3. Revoke
    const model = this.publisher.mergeObjectContext(guardianship);
    model.revoke(familyId, reason);

    // 4. Save
    await this.guardianshipRepository.save(model);
    model.commit();
  }
}