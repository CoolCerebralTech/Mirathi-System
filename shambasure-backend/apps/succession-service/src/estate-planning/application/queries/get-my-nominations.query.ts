import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { ExecutorRepositoryInterface } from '../../domain/interfaces/executor.repository.interface';
import { ExecutorResponseDto } from '../dto/response/executor.response.dto';

export class GetMyNominationsQuery {
  constructor(
    public readonly userId: string, // The potential executor
  ) {}
}

@QueryHandler(GetMyNominationsQuery)
export class GetMyNominationsHandler implements IQueryHandler<GetMyNominationsQuery> {
  constructor(
    @Inject('ExecutorRepositoryInterface')
    private readonly executorRepository: ExecutorRepositoryInterface,
  ) {}

  async execute(query: GetMyNominationsQuery): Promise<ExecutorResponseDto[]> {
    const { userId } = query;

    // 1. Fetch assignments where the user ID matches
    const executors = await this.executorRepository.findByExecutorUserId(userId);

    // 2. Filter (Optional)
    // Usually, we might want to see NOMINATED or ACTIVE ones prominently.
    // For now, return all.

    return executors.map((executor) =>
      plainToInstance(
        ExecutorResponseDto,
        {
          ...executor,
          info: executor.getExecutorInfo(),
        },
        { excludeExtraneousValues: true },
      ),
    );
  }
}
