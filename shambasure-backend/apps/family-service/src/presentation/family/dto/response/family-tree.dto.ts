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
}

export class GraphNodeDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['MEMBER', 'GHOST'] })
  type: 'MEMBER' | 'GHOST';

  @ApiProperty({ type: GraphNodeDataDto })
  data: GraphNodeDataDto;
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
}

export class GraphEdgeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  target: string;

  @ApiProperty({ enum: ['PARENT_CHILD', 'SPOUSE', 'SIBLING'] })
  type: 'PARENT_CHILD' | 'SPOUSE' | 'SIBLING';

  @ApiProperty({ type: GraphEdgeDataDto })
  data: GraphEdgeDataDto;

  @ApiPropertyOptional({ type: GraphEdgeStyleDto })
  style?: GraphEdgeStyleDto;
}

export class FamilyTreeDto {
  @ApiProperty()
  familyId: string;

  @ApiProperty({ type: [GraphNodeDto] })
  nodes: GraphNodeDto[];

  @ApiProperty({ type: [GraphEdgeDto] })
  edges: GraphEdgeDto[];
}
