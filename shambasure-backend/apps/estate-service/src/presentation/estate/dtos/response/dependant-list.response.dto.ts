import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  DependantRelationship,
  DependantStatus,
} from '../../../../domain/entities/legal-dependant.entity';
import { MoneyResponseDto } from './common/money.response.dto';

export class DependantItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: DependantRelationship })
  relationship: DependantRelationship;

  @ApiProperty({ enum: DependantStatus })
  status: DependantStatus;

  @ApiProperty()
  isMinor: boolean;

  @ApiPropertyOptional()
  age?: number;

  @ApiProperty()
  isIncapacitated: boolean;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  riskLevel: string;

  @ApiProperty({ type: MoneyResponseDto })
  monthlyMaintenanceNeeds: MoneyResponseDto;

  @ApiPropertyOptional({ type: MoneyResponseDto })
  proposedAllocation?: MoneyResponseDto;

  @ApiProperty()
  evidenceCount: number;

  @ApiProperty()
  hasSufficientEvidence: boolean;
}

export class DependantListResponseDto {
  @ApiProperty({ type: [DependantItemResponseDto] })
  items: DependantItemResponseDto[];

  @ApiProperty({ type: MoneyResponseDto })
  totalMonthlyNeeds: MoneyResponseDto;

  @ApiProperty({ description: 'Number of High Risk dependants (Minors/Incapacitated)' })
  highRiskCount: number;
}
