// src/succession-automation/src/presentation/roadmap/dtos/request/risk-integration.request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class LinkRiskRequestDto {
  @ApiProperty({
    description: 'The ID of the Risk Flag blocking progress',
    example: 'risk-uuid-123',
  })
  @IsUUID()
  @IsNotEmpty()
  riskId: string;

  @ApiProperty({
    description: 'List of Task IDs that should be blocked by this risk',
    type: [String],
    example: ['task-uuid-1', 'task-uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  blockingTaskIds: string[];

  @ApiProperty({
    description: 'Explanation for the blockage',
    example: 'Pending litigation on land parcel prohibits distribution tasks.',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
