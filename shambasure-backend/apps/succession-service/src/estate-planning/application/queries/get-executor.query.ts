import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';

import type { ExecutorRepositoryInterface } from '../../domain/interfaces/executor.repository.interface';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { ExecutorResponseDto } from '../dto/response/executor.response.dto';

export class GetExecutorQuery {
  constructor(
    public readonly willId: string,
    public readonly executorId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetExecutorQuery)
export class GetExecutorHandler implements IQueryHandler<GetExecutorQuery> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    @Inject('ExecutorRepositoryInterface')
    private readonly executorRepository: ExecutorRepositoryInterface,
  ) {}

  async execute(query: GetExecutorQuery): Promise<ExecutorResponseDto> {
    const { willId, executorId, userId } = query;

    // 1. Access Control
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate || aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Access denied.');
    }

    // 2. Fetch Executor
    const executor = await this.executorRepository.findById(executorId);
    if (!executor) {
      throw new NotFoundException(`Executor ${executorId} not found.`);
    }

    if (executor.getWillId() !== willId) {
      throw new NotFoundException('Executor does not belong to this will.');
    }

    // 3. Map to DTO
    return plainToInstance(
      ExecutorResponseDto,
      {
        ...executor,
        info: executor.getExecutorInfo(),
      },
      { excludeExtraneousValues: true },
    );
  }
}
