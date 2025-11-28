import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';

import type { ExecutorRepositoryInterface } from '../../domain/interfaces/executor.repository.interface';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { ExecutorResponseDto } from '../dto/response/executor.response.dto';

export class GetExecutorsQuery {
  constructor(
    public readonly willId: string,
    public readonly userId: string, // Testator requesting the list
  ) {}
}

@QueryHandler(GetExecutorsQuery)
export class GetExecutorsHandler implements IQueryHandler<GetExecutorsQuery> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    @Inject('ExecutorRepositoryInterface')
    private readonly executorRepository: ExecutorRepositoryInterface,
  ) {}

  async execute(query: GetExecutorsQuery): Promise<ExecutorResponseDto[]> {
    const { willId, userId } = query;

    // 1. Verify Access (Ownership Check)
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) {
      throw new NotFoundException(`Will ${willId} not found.`);
    }

    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('You do not have permission to view executors for this will.');
    }

    // 2. Fetch Executors
    // Note: Repository finds all by Will ID.
    // We use 'findExecutorsByPriority' if we want strict ordering,
    // or generic 'findByWillId' which we implemented to sort by Primary/Priority.
    const executors = await this.executorRepository.findByWillId(willId);

    // 3. Map to DTO
    return executors.map((executor) =>
      plainToInstance(
        ExecutorResponseDto,
        {
          ...executor,
          info: executor.getExecutorInfo(),
          // Flattening handled by class-transformer logic in DTO
        },
        { excludeExtraneousValues: true },
      ),
    );
  }
}
