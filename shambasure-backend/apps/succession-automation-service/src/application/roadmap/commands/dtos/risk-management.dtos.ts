// src/succession-automation/src/application/roadmap/commands/dtos/risk-management.dtos.ts
import { IsArray, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * COMMAND: Link Risk to Task
 *
 * When the Compliance Engine detects a new risk, it commands the Roadmap
 * to block specific tasks until that risk is resolved.
 */
export class LinkRiskToTaskDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  riskId: string;

  /**
   * The tasks that should be blocked by this risk.
   */
  @IsArray()
  @IsUUID('4', { each: true })
  blockingTaskIds: string[];

  @IsString()
  @IsNotEmpty()
  reason: string;
}

/**
 * COMMAND: Unlock Blocked Task
 *
 * Fired when a RiskResolved event is processed.
 */
export class UnlockBlockedTaskDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  riskId: string;

  @IsString()
  @IsNotEmpty()
  resolutionMethod: string;
}

/**
 * COMMAND: Escalate Stalled Task
 *
 * User action: "I don't know what to do / I'm stuck".
 * Sends an alert to the internal legal team.
 */
export class EscalateStalledTaskDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(['LEGAL_CLARIFICATION', 'COURT_DELAY', 'FAMILY_DISPUTE', 'DOCUMENT_UNOBTAINABLE'])
  reasonCategory: string;

  @IsString()
  @IsNotEmpty()
  userNotes: string;
}
