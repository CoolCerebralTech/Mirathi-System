import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { RelationshipRepositoryInterface } from '../../domain/interfaces/relationship.repository.interface';

export class RemoveRelationshipCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly relationshipId: string,
  ) {}
}

@CommandHandler(RemoveRelationshipCommand)
export class RemoveRelationshipHandler implements ICommandHandler<RemoveRelationshipCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepository: RelationshipRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RemoveRelationshipCommand): Promise<void> {
    const { familyId, userId, relationshipId } = command;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) {
      throw new BadRequestException('Access denied.');
    }

    // 2. Load
    const relationship = await this.relationshipRepository.findById(relationshipId);
    if (!relationship) {
      throw new NotFoundException(`Relationship ${relationshipId} not found.`);
    }

    if (relationship.getFamilyId() !== familyId) {
      throw new BadRequestException('Relationship does not belong to this family.');
    }

    // 3. Execute
    const relModel = this.publisher.mergeObjectContext(relationship);
    relModel.remove('User requested removal'); // Emits Event

    // 4. Delete (Hard delete for edges to keep graph clean, event audit trail remains)
    await this.relationshipRepository.delete(relationshipId);

    // Note: We commit AFTER delete to ensure event fires only on successful DB op
    relModel.commit();
  }
}
