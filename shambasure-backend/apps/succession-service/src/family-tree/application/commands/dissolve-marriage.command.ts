import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DissolveMarriageDto } from '../dto/request/dissolve-marriage.dto';
import type { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import type { MarriageRepositoryInterface } from '../../domain/interfaces/marriage.repository.interface';

export class DissolveMarriageCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly marriageId: string,
    public readonly dto: DissolveMarriageDto,
  ) {}
}

@CommandHandler(DissolveMarriageCommand)
export class DissolveMarriageHandler implements ICommandHandler<DissolveMarriageCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepository: MarriageRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: DissolveMarriageCommand): Promise<void> {
    const { familyId, userId, marriageId, dto } = command;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) {
      throw new BadRequestException('Access denied.');
    }

    // 2. Load Marriage
    const marriage = await this.marriageRepository.findById(marriageId);
    if (!marriage) throw new NotFoundException(`Marriage ${marriageId} not found.`);

    if (marriage.getFamilyId() !== familyId) {
      throw new BadRequestException('Marriage belongs to a different tree.');
    }

    // 3. Execute Logic
    const marriageModel = this.publisher.mergeObjectContext(marriage);

    try {
      marriageModel.dissolve(
        new Date(dto.divorceDate),
        dto.divorceCertNumber, // Decree Absolute / Court Order required
      );
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    // 4. Save
    await this.marriageRepository.save(marriageModel);
    marriageModel.commit();
  }
}
