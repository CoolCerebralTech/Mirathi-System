// src/succession-automation/src/presentation/roadmap/dtos/response/task-detail.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ProofType } from '../../../../domain/entities/roadmap-task.entity';
import { TaskSummaryResponseDto } from './task-list.response.dto';

class ExternalLinkResponse {
  @ApiProperty({ example: 'Civil Registration Portal' })
  title: string;

  @ApiProperty({ example: 'https://civilregistration.go.ke' })
  url: string;

  @ApiProperty({ example: 'GOVERNMENT_PORTAL' })
  type: string;
}

class LegalReferenceResponse {
  @ApiProperty({ example: 'LSA' })
  act: string;

  @ApiProperty({ example: '56' })
  section: string;

  @ApiProperty({ example: 'Mandatory death certificate requirement' })
  description: string;
}

class DependencyStatusResponse {
  @ApiProperty({ example: 'task-uuid-999' })
  id: string;

  @ApiProperty({ example: true })
  isMet: boolean;
}

class HistoryEntryResponse {
  @ApiProperty({ example: 'STARTED' })
  action: string;

  @ApiProperty({ example: '2025-01-01T10:00:00.000Z' })
  date: string;

  @ApiProperty({ example: 'user-uuid-123' })
  user: string;

  @ApiPropertyOptional({ example: 'User started task manually' })
  details?: string;
}

export class TaskDetailResponseDto extends TaskSummaryResponseDto {
  @ApiProperty({ example: 'Full detailed description of the task...' })
  description: string;

  @ApiProperty({ type: [String], example: ['Step 1: Go to office', 'Step 2: Pay fee'] })
  detailedInstructions: string[];

  @ApiProperty({ type: [String], example: ['Carry original ID', 'Go early morning'] })
  quickTips: string[];

  @ApiProperty({ type: [String], example: ['Forgeting receipt'] })
  commonMistakes: string[];

  @ApiProperty({ type: [ExternalLinkResponse] })
  externalLinks: ExternalLinkResponse[];

  @ApiProperty({ type: [LegalReferenceResponse] })
  legalReferences: LegalReferenceResponse[];

  @ApiProperty({ example: true })
  requiresProof: boolean;

  @ApiProperty({ enum: ProofType, isArray: true, example: [ProofType.DOCUMENT_UPLOAD] })
  proofTypes: ProofType[];

  @ApiPropertyOptional({ example: 'DEATH_CERTIFICATE' })
  proofDocumentType?: string;

  @ApiProperty({ type: [DependencyStatusResponse] })
  dependencies: DependencyStatusResponse[];

  @ApiPropertyOptional({ example: '2025-01-05T00:00:00.000Z' })
  completedAt?: string;

  @ApiPropertyOptional({ example: 'user-uuid-123' })
  completedBy?: string;

  @ApiPropertyOptional({ example: 'Uploaded the certified copy.' })
  completionNotes?: string;

  @ApiProperty({ type: [HistoryEntryResponse] })
  historyLog: HistoryEntryResponse[];
}
