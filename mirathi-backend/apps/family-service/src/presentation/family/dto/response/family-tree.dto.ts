import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Gender } from '../../../../domain/value-objects/family-enums.vo';

class GraphNodeDataDto {
  @ApiProperty()
  fullName: string;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiPropertyOptional()
  dateOfBirth?: string;

  @ApiProperty()
  isAlive: boolean;

  @ApiProperty()
  isHeadOfFamily: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  hasMissingData: boolean;

  @ApiPropertyOptional()
  photoUrl?: string;

  // --- S.40 Visualization ---
  @ApiPropertyOptional({ description: 'UUID of the polygamous house this member belongs to' })
  houseId?: string;

  @ApiPropertyOptional({ description: 'Hex color code for the house (e.g. #FF5733)' })
  houseColor?: string;
}

export class GraphNodeDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['MEMBER', 'GHOST'] })
  type: 'MEMBER' | 'GHOST';

  @ApiProperty({ type: GraphNodeDataDto })
  data: GraphNodeDataDto;

  @ApiPropertyOptional()
  generationLevel?: number;
}

class GraphEdgeDataDto {
  @ApiProperty()
  isBiological: boolean;

  @ApiProperty()
  isLegal: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiPropertyOptional()
  label?: string;
}

class GraphEdgeStyleDto {
  @ApiPropertyOptional()
  stroke?: string;

  @ApiPropertyOptional()
  strokeWidth?: number;

  @ApiPropertyOptional({ description: 'SVG stroke-dasharray for dotted lines (e.g. "5,5")' })
  strokeDasharray?: string;

  @ApiPropertyOptional({ description: 'If true, UI should animate this edge flow' })
  animated?: boolean;
}

export class GraphEdgeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  target: string;

  @ApiProperty({ enum: ['PARENT_CHILD', 'SPOUSE', 'SIBLING', 'COHABITATION'] })
  type: 'PARENT_CHILD' | 'SPOUSE' | 'SIBLING' | 'COHABITATION';

  @ApiProperty({ type: GraphEdgeDataDto })
  data: GraphEdgeDataDto;

  @ApiPropertyOptional({ type: GraphEdgeStyleDto })
  style?: GraphEdgeStyleDto;
}

class FamilyGraphStatsDto {
  @ApiProperty()
  nodesCount: number;

  @ApiProperty()
  edgesCount: number;

  @ApiProperty()
  generations: number;
}

export class FamilyTreeDto {
  @ApiProperty()
  familyId: string;

  @ApiProperty({ type: FamilyGraphStatsDto })
  stats: FamilyGraphStatsDto;

  @ApiProperty({ type: [GraphNodeDto] })
  nodes: GraphNodeDto[];

  @ApiProperty({ type: [GraphEdgeDto] })
  edges: GraphEdgeDto[];
}
