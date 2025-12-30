// src/succession-automation/src/application/roadmap/commands/handlers/task-execution.handlers.ts
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import type { IRoadmapRepository } from '../../../../domain/repositories/i-roadmap.repository';
import { EXECUTOR_ROADMAP_REPOSITORY } from '../../../../domain/repositories/i-roadmap.repository';
import { Result } from '../../../common/result';
import { DependencyResolverService } from '../../services/task-automation/dependency-resolver.service';
import { ProofValidatorService } from '../../services/task-automation/proof-validator.service';
import {
  SkipTaskCommand,
  StartTaskCommand,
  SubmitTaskProofCommand,
} from '../impl/task-execution.commands';

// ==================== START TASK HANDLER ====================

@CommandHandler(StartTaskCommand)
export class StartTaskHandler implements ICommandHandler<StartTaskCommand> {
  private readonly logger = new Logger(StartTaskHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: StartTaskCommand): Promise<Result<void>> {
    const { roadmapId, taskId, userId } = command.dto;
    const traceId = command.traceId;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail(`Roadmap not found: ${roadmapId}`);

      // Domain Logic: Start the task (Checks dependencies internally)
      roadmap.startTask(taskId, userId);

      await this.roadmapRepository.save(roadmap);

      // Publish Events
      roadmap.getDomainEvents().forEach((e) => this.eventBus.publish(e));
      roadmap.clearEvents();

      this.logger.log(`[${traceId}] Task started: ${taskId}`);
      return Result.ok();
    } catch (error) {
      this.logger.error(`[${traceId}] Failed to start task`, error);
      return Result.fail(error instanceof Error ? error : new Error('Start task failed'));
    }
  }
}

// ==================== SUBMIT PROOF HANDLER (COMPLETION) ====================

@CommandHandler(SubmitTaskProofCommand)
export class SubmitTaskProofHandler implements ICommandHandler<SubmitTaskProofCommand> {
  private readonly logger = new Logger(SubmitTaskProofHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
    private readonly proofValidator: ProofValidatorService,
    private readonly dependencyResolver: DependencyResolverService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SubmitTaskProofCommand): Promise<Result<void>> {
    // FIX: Destructure 'notes' (from DTO) instead of 'completionNotes'
    const { roadmapId, taskId, userId, proofType, notes } = command.dto;

    // Map DTO specific fields to a generic proof payload
    const proofPayload = {
      documentId: command.dto.documentId,
      transactionReference: command.dto.transactionReference,
      metadata: command.dto.additionalMetadata,
    };

    const traceId = command.traceId;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail(`Roadmap not found: ${roadmapId}`);

      // 1. Validate Proof (Application Service)
      const task = roadmap.tasks.find((t) => t.id.equals(taskId));
      if (!task) return Result.fail(`Task not found: ${taskId}`);

      if (task.requiresProof) {
        if (!task.proofTypes.includes(proofType)) {
          return Result.fail(`Invalid proof type ${proofType} for task ${taskId}`);
        }

        const validationResult = await this.proofValidator.validateProof(proofType, proofPayload);
        if (validationResult.isFailure) {
          return Result.fail(`Proof validation failed: ${validationResult.error?.message}`);
        }
      }

      // 2. Complete Task (Domain Logic)
      // Pass 'notes' from DTO as the completion notes
      roadmap.completeTask(taskId, userId, notes, proofPayload);

      // 3. Resolve Dependencies (Application Service)
      this.dependencyResolver.resolveDependencies(roadmap);

      // 4. Persistence
      await this.roadmapRepository.save(roadmap);

      // 5. Publish Events
      // Use standard getter for events (assuming your aggregate has it)
      const events = roadmap.getDomainEvents();
      if (events) {
        events.forEach((e) => this.eventBus.publish(e));
        roadmap.clearEvents();
      }

      this.logger.log(`[${traceId}] Task completed: ${taskId}`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `[${traceId}] Failed to submit proof`,
        error instanceof Error ? error.stack : String(error),
      );
      return Result.fail(error instanceof Error ? error : new Error('Submit proof failed'));
    }
  }
}

// ==================== SKIP TASK HANDLER ====================

@CommandHandler(SkipTaskCommand)
export class SkipTaskHandler implements ICommandHandler<SkipTaskCommand> {
  private readonly logger = new Logger(SkipTaskHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
    private readonly dependencyResolver: DependencyResolverService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SkipTaskCommand): Promise<Result<void>> {
    const { roadmapId, taskId, reason } = command.dto;
    const traceId = command.traceId;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail(`Roadmap not found: ${roadmapId}`);

      roadmap.skipTask(taskId, reason);

      // Resolve dependencies (skipping might unlock next steps)
      this.dependencyResolver.resolveDependencies(roadmap);

      await this.roadmapRepository.save(roadmap);

      roadmap.getDomainEvents().forEach((e) => this.eventBus.publish(e));
      roadmap.clearEvents();

      this.logger.log(`[${traceId}] Task skipped: ${taskId}`);
      return Result.ok();
    } catch (error) {
      this.logger.error(`[${traceId}] Failed to skip task`, error);
      return Result.fail(error instanceof Error ? error : new Error('Skip task failed'));
    }
  }
}
