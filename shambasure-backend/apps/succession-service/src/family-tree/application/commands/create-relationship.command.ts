import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateRelationshipDto } from '../dto/request/create-relationship.dto';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { RelationshipRepositoryInterface } from '../../domain/interfaces/relationship.repository.interface';
import { RelationshipIntegrityService } from '../../domain/services/relationship-integrity.service';
import { Relationship } from '../../domain/entities/relationship.entity';

export class CreateRelationshipCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly dto: CreateRelationshipDto,
  ) {}
}

@CommandHandler(CreateRelationshipCommand)
export class CreateRelationshipHandler implements ICommandHandler<CreateRelationshipCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepository: RelationshipRepositoryInterface,
    private readonly integrityService: RelationshipIntegrityService,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateRelationshipCommand): Promise<string> {
    const { familyId, userId, dto } = command;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) {
      throw new BadRequestException('Access denied or Family not found.');
    }

    // 2. Duplicate Check
    const exists = await this.relationshipRepository.exists(
      dto.fromMemberId,
      dto.toMemberId,
      dto.type,
    );
    if (exists) {
      throw new BadRequestException('Relationship already exists.');
    }

    // 3. Integrity & Validation (Cycles, Biology, etc.)
    // This service throws BadRequestException if invalid
    await this.integrityService.validateNewRelationship(
      familyId,
      dto.fromMemberId,
      dto.toMemberId,
      dto.type
    );

    // 4. Create Entity
    const relationshipId = uuidv4();
    const relationship = Relationship.create(
      relationshipId,
      familyId,
      dto.fromMemberId,
      dto.toMemberId,
      dto.type,
      {
        isAdopted: dto.isAdopted,
        adoptionOrderNumber: dto.adoptionOrderNumber,
        bornOutOfWedlock: dto.bornOutOfWedlock
      }
    );

    // 5. Persist
    const relModel = this.publisher.mergeObjectContext(relationship);
    await this.relationshipRepository.save(relModel);
    relModel.commit();

    return relationshipId;
  }
}