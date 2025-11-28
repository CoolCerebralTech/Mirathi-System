import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { VerifyRelationshipDto } from '../dto/request/verify-relationship.dto';
import { RelationshipRepositoryInterface } from '../../domain/interfaces/relationship.repository.interface';

export class VerifyRelationshipCommand {
  constructor(
    public readonly relationshipId: string,
    public readonly verifierId: string, // The Admin/Verifier
    public readonly dto: VerifyRelationshipDto,
  ) {}
}

@CommandHandler(VerifyRelationshipCommand)
export class VerifyRelationshipHandler implements ICommandHandler<VerifyRelationshipCommand> {
  constructor(
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepository: RelationshipRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: VerifyRelationshipCommand): Promise<void> {
    const { relationshipId, verifierId, dto } = command;

    // 1. Load
    const relationship = await this.relationshipRepository.findById(relationshipId);
    if (!relationship) {
      throw new NotFoundException(`Relationship ${relationshipId} not found.`);
    }

    // 2. Execute Logic
    const relModel = this.publisher.mergeObjectContext(relationship);

    // Map DTO string to allowed Union Type in Entity
    // 'BIRTH_CERTIFICATE' | 'AFFIDAVIT' | 'DNA_TEST' | 'COMMUNITY_RECOGNITION'
    relModel.verify(dto.verificationMethod as any, verifierId);

    // 3. Save
    await this.relationshipRepository.save(relModel);
    relModel.commit();
  }
}
