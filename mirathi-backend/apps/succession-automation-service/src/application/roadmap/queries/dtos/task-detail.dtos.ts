// src/succession-automation/src/application/roadmap/queries/dtos/task-detail.dtos.ts
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * QUERY: Get Task Details
 *
 * Returns full rich details:
 * - Instructions & Tips
 * - External Links
 * - Dependencies (Blockers)
 * - Required Proofs
 */
export class GetTaskDetailsDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  taskId: string;
}

/**
 * QUERY: Get Task Audit History
 *
 * Returns the timeline of a specific task:
 * "Started by John on Mon" -> "Blocked by Risk on Tue" -> "Proof Uploaded on Wed"
 */
export class GetTaskHistoryDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  taskId: string;
}
