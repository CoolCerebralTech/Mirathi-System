import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateWillDto } from '../dto/request/create-will.dto';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { LegalCapacity } from '../../domain/value-objects/legal-capacity.vo';

export class CreateWillCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateWillDto,
  ) {}
}

@CommandHandler(CreateWillCommand)
export class CreateWillHandler implements ICommandHandler<CreateWillCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateWillCommand): Promise<string> {
    const { userId, dto } = command;

    // 1. Construct Legal Capacity Value Object (Section 7 Compliance)
    // The DTO validation ensures these fields exist, but the VO enforces logic dates/truthiness
    const legalCapacity = new LegalCapacity({
      isOfAge: dto.legalCapacity.isOfAge,
      isSoundMind: dto.legalCapacity.isSoundMind,
      understandsWillNature: dto.legalCapacity.understandsNature,
      understandsAssetExtent: dto.legalCapacity.understandsAssets,
      understandsBeneficiaryClaims: true, // Implicit in standard creation flow
      freeFromUndueInfluence: dto.legalCapacity.freeFromUndueInfluence,
      assessmentDate: new Date(),
      assessedBy: 'SELF_DECLARATION', // Initial stage
    });

    if (!legalCapacity.hasLegalCapacity()) {
      throw new BadRequestException(
        'Cannot create will: Testator does not meet legal capacity requirements (Section 7).',
      );
    }

    // 2. Create Aggregate
    const willId = uuidv4();
    const aggregate = WillAggregate.create(willId, dto.title, userId, legalCapacity);

    // 3. Merge Context & Save
    const willModel = this.publisher.mergeObjectContext(aggregate);
    await this.willRepository.save(willModel);
    willModel.commit();

    return willId;
  }
}
