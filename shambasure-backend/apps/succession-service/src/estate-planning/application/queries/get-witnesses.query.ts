import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import type { WitnessRepositoryInterface } from '../../domain/interfaces/witness.repository.interface';
import { WitnessResponseDto } from '../dto/response/witness.response.dto';

export class GetWitnessesQuery {
  constructor(
    public readonly willId: string,
    public readonly userId: string, // Testator
  ) {}
}

@QueryHandler(GetWitnessesQuery)
export class GetWitnessesHandler implements IQueryHandler<GetWitnessesQuery> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    @Inject('WitnessRepositoryInterface')
    private readonly witnessRepository: WitnessRepositoryInterface,
  ) {}

  async execute(query: GetWitnessesQuery): Promise<WitnessResponseDto[]> {
    const { willId, userId } = query;

    // 1. Verify Access (Ownership Check)
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) {
      throw new NotFoundException(`Will ${willId} not found.`);
    }

    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('You do not have permission to view witnesses for this will.');
    }

    // 2. Fetch Witnesses
    const witnesses = await this.witnessRepository.findByWillId(willId);

    // 3. Map to DTO
    return witnesses.map((witness) =>
      plainToInstance(
        WitnessResponseDto,
        {
          ...witness,
          info: witness.getWitnessInfo(),
          // Flattening logic handled by class-transformer based on DTO structure
        },
        { excludeExtraneousValues: true },
      ),
    );
  }
}
