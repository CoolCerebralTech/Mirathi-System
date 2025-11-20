import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Commands
import { NominateExecutorCommand } from '../commands/nominate-executor.command';
import { RemoveExecutorCommand } from '../commands/remove-executor.command';

// Queries
import { GetExecutorsQuery } from '../queries/get-executors.query';
import { GetExecutorQuery } from '../queries/get-executor.query';
import { GetMyNominationsQuery } from '../queries/get-my-nominations.query';

// DTOs
import { NominateExecutorDto } from '../dto/request/nominate-executor.dto';
import { ExecutorResponseDto } from '../dto/response/executor.response.dto';

@Injectable()
export class ExecutorService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS (Commands)
  // --------------------------------------------------------------------------

  /**
   * Nominates an executor (Personal Representative) for the Will.
   * Enforces eligibility policies (Age, Mental Capacity checks).
   * @returns The ID of the newly created executor record.
   */
  async nominateExecutor(
    willId: string,
    userId: string,
    dto: NominateExecutorDto,
  ): Promise<string> {
    return this.commandBus.execute(new NominateExecutorCommand(willId, userId, dto));
  }

  /**
   * Removes an executor nomination.
   * Allowed during drafting, but restricted once the Will is Active (requires Codicil).
   */
  async removeExecutor(willId: string, userId: string, executorId: string): Promise<void> {
    return this.commandBus.execute(new RemoveExecutorCommand(willId, userId, executorId));
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS (Queries)
  // --------------------------------------------------------------------------

  /**
   * Lists all executors appointed in a specific Will.
   * Ordered by Priority (Primary -> Alternates).
   * Security: Restricted to the Testator.
   */
  async getExecutors(willId: string, userId: string): Promise<ExecutorResponseDto[]> {
    return this.queryBus.execute(new GetExecutorsQuery(willId, userId));
  }

  /**
   * Retrieves details of a specific executor appointment.
   */
  async getExecutor(
    willId: string,
    executorId: string,
    userId: string,
  ): Promise<ExecutorResponseDto> {
    return this.queryBus.execute(new GetExecutorQuery(willId, executorId, userId));
  }

  /**
   * Retrieves a list of wills where the CURRENT USER has been nominated as an executor.
   * Used for the "My Duties" / "Pending Requests" dashboard.
   */
  async getMyNominations(userId: string): Promise<ExecutorResponseDto[]> {
    return this.queryBus.execute(new GetMyNominationsQuery(userId));
  }
}
