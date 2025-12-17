// application/family/queries/impl/check-s40-compliance.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseQuery } from '../base.query';

export enum S40ComplianceReportType {
  SUMMARY = 'SUMMARY',
  DETAILED = 'DETAILED',
  HOUSE_BY_HOUSE = 'HOUSE_BY_HOUSE',
  LEGAL = 'LEGAL',
}

export class CheckS40ComplianceQuery extends BaseQuery {
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
    description: 'Family ID to check compliance for',
    example: 'fam-1234567890',
  })
  @IsString()
  readonly familyId: string;

  @ApiPropertyOptional({
    description: 'Report type',
    example: S40ComplianceReportType.SUMMARY,
    enum: S40ComplianceReportType,
    default: S40ComplianceReportType.SUMMARY,
  })
  @IsOptional()
  @IsEnum(S40ComplianceReportType)
  readonly reportType?: S40ComplianceReportType = S40ComplianceReportType.SUMMARY;

  @ApiPropertyOptional({
    description: 'Include recommendations for compliance improvement',
    example: true,
    default: true,
  })
  @IsOptional()
  readonly includeRecommendations?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include legal references and citations',
    example: false,
    default: false,
  })
  @IsOptional()
  readonly includeLegalReferences?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include compliance history',
    example: false,
    default: false,
  })
  @IsOptional()
  readonly includeHistory?: boolean = false;

  @ApiPropertyOptional({
    description: 'Format response for legal documentation',
    example: false,
    default: false,
  })
  @IsOptional()
  readonly legalDocumentationFormat?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include estimated distribution calculations',
    example: true,
    default: true,
  })
  @IsOptional()
  readonly includeDistributionCalculations?: boolean = true;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    familyId: string,
    reportType?: S40ComplianceReportType,
    includeRecommendations?: boolean,
    includeLegalReferences?: boolean,
    includeHistory?: boolean,
    legalDocumentationFormat?: boolean,
    includeDistributionCalculations?: boolean,
    correlationId?: string,
  ) {
    super();
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.familyId = familyId;
    this.reportType = reportType;
    this.includeRecommendations = includeRecommendations;
    this.includeLegalReferences = includeLegalReferences;
    this.includeHistory = includeHistory;
    this.legalDocumentationFormat = legalDocumentationFormat;
    this.includeDistributionCalculations = includeDistributionCalculations;
    this.correlationId = correlationId;
  }

  static create(
    userId: string,
    familyId: string,
    options?: {
      reportType?: S40ComplianceReportType;
      includeRecommendations?: boolean;
      includeLegalReferences?: boolean;
      includeHistory?: boolean;
      legalDocumentationFormat?: boolean;
      includeDistributionCalculations?: boolean;
      correlationId?: string;
    },
  ): CheckS40ComplianceQuery {
    const {
      reportType = S40ComplianceReportType.SUMMARY,
      includeRecommendations = true,
      includeLegalReferences = false,
      includeHistory = false,
      legalDocumentationFormat = false,
      includeDistributionCalculations = true,
      correlationId,
    } = options || {};

    return new CheckS40ComplianceQuery(
      `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      familyId,
      reportType,
      includeRecommendations,
      includeLegalReferences,
      includeHistory,
      legalDocumentationFormat,
      includeDistributionCalculations,
      correlationId,
    );
  }
}
