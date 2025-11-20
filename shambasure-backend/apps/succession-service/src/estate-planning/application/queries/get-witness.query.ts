import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import type { WitnessRepositoryInterface } from '../../domain/interfaces/witness.repository.interface';
import { WitnessResponseDto } from '../dto/response/witness.response.dto';

export class GetWitnessQuery {
  constructor(
    public readonly willId: string,
    public readonly witnessId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetWitnessQuery)
export class GetWitnessHandler implements IQueryHandler<GetWitnessQuery> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    @Inject('WitnessRepositoryInterface')
    private readonly witnessRepository: WitnessRepositoryInterface,
  ) {}

  async execute(query: GetWitnessQuery): Promise<WitnessResponseDto> {
    const { willId, witnessId, userId } = query;

    // 1. Access Control
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate || aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Access denied.');
    }

    // 2. Fetch Witness
    const witness = await this.witnessRepository.findById(witnessId);
    if (!witness) {
      throw new NotFoundException(`Witness ${witnessId} not found.`);
    }

    if (witness.getWillId() !== willId) {
      throw new NotFoundException('Witness does not belong to this will.');
    }

    // 3. Map to DTO
    return plainToInstance(
      WitnessResponseDto,
      {
        ...witness,
        info: witness.getWitnessInfo(),
      },
      { excludeExtraneousValues: true },
    );
  }
}
