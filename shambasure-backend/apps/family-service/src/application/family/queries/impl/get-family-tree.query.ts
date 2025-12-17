// application/family/queries/impl/get-family-tree.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { BaseQuery } from '../base.query';

export enum TreeOrientation {
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL',
}

export enum TreeLayout {
  STANDARD = 'STANDARD',
  COMPACT = 'COMPACT',
  DETAILED = 'DETAILED',
}

export class GetFamilyTreeQuery extends BaseQuery {
  @ApiProperty({
    description: 'Unique query identifier',
    example: 'qry-1234567890',
  })
  @IsUUID('4')
  readonly queryId: string;

  @ApiProperty({
    description: 'Query timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsNotEmpty()
  readonly timestamp: Date;

  @ApiProperty({
    description: 'Correlation ID for tracing',
    example: 'corr-1234567890',
  })
  @IsUUID('4')
  readonly correlationId?: string;

  @ApiProperty({
    description: 'User ID executing the query',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  readonly userId: string;

  @ApiProperty({
    description: 'Family ID to retrieve tree for',
    example: 'fam-1234567890',
  })
  @IsString()
  readonly familyId: string;

  @ApiPropertyOptional({
    description: 'Root member ID for tree (defaults to oldest known ancestor)',
    example: 'fm-1234567890',
  })
  @IsOptional()
  @IsString()
  readonly rootMemberId?: string;

  @ApiPropertyOptional({
    description: 'Maximum tree depth (generations to include)',
    example: 4,
    default: 4,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  readonly maxDepth?: number = 4;

  @ApiPropertyOptional({
    description: 'Include deceased members in tree',
    example: true,
    default: true,
  })
  @IsOptional()
  readonly includeDeceased?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include adopted relationships',
    example: true,
    default: true,
  })
  @IsOptional()
  readonly includeAdopted?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include step relationships',
    example: true,
    default: true,
  })
  @IsOptional()
  readonly includeStepRelations?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include polygamous house information',
    example: true,
    default: true,
  })
  @IsOptional()
  readonly includePolygamousHouses?: boolean = true;

  @ApiPropertyOptional({
    description: 'Tree orientation for visualization',
    example: TreeOrientation.HORIZONTAL,
    enum: TreeOrientation,
    default: TreeOrientation.HORIZONTAL,
  })
  @IsOptional()
  @IsEnum(TreeOrientation)
  readonly orientation?: TreeOrientation = TreeOrientation.HORIZONTAL;

  @ApiPropertyOptional({
    description: 'Tree layout style',
    example: TreeLayout.STANDARD,
    enum: TreeLayout,
    default: TreeLayout.STANDARD,
  })
  @IsOptional()
  @IsEnum(TreeLayout)
  readonly layout?: TreeLayout = TreeLayout.STANDARD;

  @ApiPropertyOptional({
    description: 'Node width for visualization (in pixels)',
    example: 200,
    default: 200,
    minimum: 100,
    maximum: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(500)
  readonly nodeWidth?: number = 200;

  @ApiPropertyOptional({
    description: 'Node height for visualization (in pixels)',
    example: 60,
    default: 60,
    minimum: 40,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(200)
  readonly nodeHeight?: number = 60;

  @ApiPropertyOptional({
    description: 'Include member photos in tree nodes',
    example: false,
    default: false,
  })
  @IsOptional()
  readonly includePhotos?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include detailed member information in tree nodes',
    example: false,
    default: false,
  })
  @IsOptional()
  readonly includeDetails?: boolean = false;

  @ApiPropertyOptional({
    description: 'Filter by generation (e.g., only show 2nd generation)',
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  readonly generationFilter?: number;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    familyId: string,
    rootMemberId?: string,
    maxDepth?: number,
    includeDeceased?: boolean,
    includeAdopted?: boolean,
    includeStepRelations?: boolean,
    includePolygamousHouses?: boolean,
    orientation?: TreeOrientation,
    layout?: TreeLayout,
    nodeWidth?: number,
    nodeHeight?: number,
    includePhotos?: boolean,
    includeDetails?: boolean,
    generationFilter?: number,
    correlationId?: string,
  ) {
    super();
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.familyId = familyId;
    this.rootMemberId = rootMemberId;
    this.maxDepth = maxDepth;
    this.includeDeceased = includeDeceased;
    this.includeAdopted = includeAdopted;
    this.includeStepRelations = includeStepRelations;
    this.includePolygamousHouses = includePolygamousHouses;
    this.orientation = orientation;
    this.layout = layout;
    this.nodeWidth = nodeWidth;
    this.nodeHeight = nodeHeight;
    this.includePhotos = includePhotos;
    this.includeDetails = includeDetails;
    this.generationFilter = generationFilter;
    this.correlationId = correlationId;
  }

  static create(
    userId: string,
    familyId: string,
    options?: {
      rootMemberId?: string;
      maxDepth?: number;
      includeDeceased?: boolean;
      includeAdopted?: boolean;
      includeStepRelations?: boolean;
      includePolygamousHouses?: boolean;
      orientation?: TreeOrientation;
      layout?: TreeLayout;
      nodeWidth?: number;
      nodeHeight?: number;
      includePhotos?: boolean;
      includeDetails?: boolean;
      generationFilter?: number;
      correlationId?: string;
    },
  ): GetFamilyTreeQuery {
    const {
      rootMemberId,
      maxDepth = 4,
      includeDeceased = true,
      includeAdopted = true,
      includeStepRelations = true,
      includePolygamousHouses = true,
      orientation = TreeOrientation.HORIZONTAL,
      layout = TreeLayout.STANDARD,
      nodeWidth = 200,
      nodeHeight = 60,
      includePhotos = false,
      includeDetails = false,
      generationFilter,
      correlationId,
    } = options || {};

    return new GetFamilyTreeQuery(
      `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      familyId,
      rootMemberId,
      maxDepth,
      includeDeceased,
      includeAdopted,
      includeStepRelations,
      includePolygamousHouses,
      orientation,
      layout,
      nodeWidth,
      nodeHeight,
      includePhotos,
      includeDetails,
      generationFilter,
      correlationId,
    );
  }
}
