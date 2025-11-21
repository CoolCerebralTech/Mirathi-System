import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateFamilyDto } from '../dto/request/update-family.dto';
import type { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';

export class UpdateFamilyCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly dto: UpdateFamilyDto,
  ) {}
}

@CommandHandler(UpdateFamilyCommand)
export class UpdateFamilyHandler implements ICommandHandler<UpdateFamilyCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdateFamilyCommand): Promise<void> {
    const { familyId, userId, dto } = command;

    const family = await this.familyRepository.findById(familyId);
    if (!family) throw new NotFoundException(`Family ${familyId} not found.`);

    if (family.getOwnerId() !== userId) {
      throw new BadRequestException('Access denied.');
    }

    const familyModel = this.publisher.mergeObjectContext(family);

    if (dto.name) {
      familyModel.updateMetadata(dto.name, dto.description);
    }

    await this.familyRepository.save(familyModel);
    familyModel.commit();
  }
}
