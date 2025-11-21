import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateMarriageDto } from '../dto/request/update-marriage.dto';
import type { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import type { MarriageRepositoryInterface } from '../../domain/interfaces/marriage.repository.interface';

export class UpdateMarriageCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly marriageId: string,
    public readonly dto: UpdateMarriageDto,
  ) {}
}

@CommandHandler(UpdateMarriageCommand)
export class UpdateMarriageHandler implements ICommandHandler<UpdateMarriageCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepository: MarriageRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdateMarriageCommand): Promise<void> {
    const { familyId, userId, marriageId, dto } = command;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) {
      throw new BadRequestException('Access denied.');
    }

    const marriage = await this.marriageRepository.findById(marriageId);
    if (!marriage) throw new NotFoundException(`Marriage ${marriageId} not found.`);

    const marriageModel = this.publisher.mergeObjectContext(marriage);

    // 2. Updates
    if (dto.certificateNumber) {
        marriageModel.registerCertificate(dto.certificateNumber);
    }
    
    // Note: We generally don't allow changing dates easily as it affects chronology validation.
    // But for correcting data entry errors, we might allow it via strict admin flows or flexible entities.
    // Entity didn't expose "setDate", but we can add if needed. 
    // For now, we assume only certificate updates are common in this flow.

    await this.marriageRepository.save(marriageModel);
    marriageModel.commit();
  }
}