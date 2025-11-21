import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateMarriageDto } from '../dto/request/create-marriage.dto';
import type { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import type { MarriageRepositoryInterface } from '../../domain/interfaces/marriage.repository.interface';
import { RelationshipIntegrityService } from '../../domain/services/relationship-integrity.service';
import { Marriage } from '../../domain/entities/marriage.entity';

export class CreateMarriageCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly dto: CreateMarriageDto,
  ) {}
}

@CommandHandler(CreateMarriageCommand)
export class CreateMarriageHandler implements ICommandHandler<CreateMarriageCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepository: MarriageRepositoryInterface,
    private readonly integrityService: RelationshipIntegrityService,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateMarriageCommand): Promise<string> {
    const { familyId, userId, dto } = command;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) {
      throw new BadRequestException('Access denied or Family not found.');
    }

    // 2. Integrity Check (Polygamy & Incest Rules)
    // This service throws BadRequestException if the union is illegal under Kenyan Law
    await this.integrityService.validateNewMarriage(dto.spouse1Id, dto.spouse2Id, dto.type);

    // 3. Create Entity
    const marriageId = uuidv4();
    const marriage = Marriage.create(
      marriageId,
      familyId,
      dto.spouse1Id,
      dto.spouse2Id,
      dto.type,
      new Date(dto.marriageDate),
      dto.certificateNumber,
    );

    // 4. Persist
    const marriageModel = this.publisher.mergeObjectContext(marriage);
    await this.marriageRepository.save(marriageModel);
    marriageModel.commit();

    return marriageId;
  }
}
