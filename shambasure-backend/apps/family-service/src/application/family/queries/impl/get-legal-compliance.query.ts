// application/family/queries/impl/get-legal-compliance.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseQuery } from '../base.query';

export enum ComplianceSection {
  S29 = 'S29', // Dependants
  S40 = 'S40', // Polygamy
  S70 = 'S70', // Guardianship
  ALL = 'ALL',
  MARRIAGE_ACT = 'MARRIAGE_ACT',
  CHILDREN_ACT = 'CHILDREN_ACT',
}

export class GetLegalComplianceQuery extends BaseQuery {
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
    description: 'Specific section(s) to check',
    example: [ComplianceSection.S40],
    enum: ComplianceSection,
    isArray: true,
    default: [ComplianceSection.ALL],
  })
  @IsOptional()
  @IsEnum(ComplianceSection, { each: true })
  readonly sections?: ComplianceSection[] = [ComplianceSection.ALL];

  @ApiPropertyOptional({
    description: 'Include detailed compliance issues',
    example: true,
    default: true,
  })
  @IsOptional()
  readonly includeIssues?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include compliance recommendations',
    example: true,
    default: true,
  })
  @IsOptional()
  readonly includeRecommendations?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include legal citations and references',
    example: false,
    default: false,
  })
  @IsOptional()
  readonly includeLegalReferences?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include compliance history and trends',
    example: false,
    default: false,
  })
  @IsOptional()
  readonly includeHistory?: boolean = false;

  @ApiPropertyOptional({
    description: 'Generate compliance certificate',
    example: false,
    default: false,
  })
  @IsOptional()
  readonly generateCertificate?: boolean = false;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    familyId: string,
    sections?: ComplianceSection[],
    includeIssues?: boolean,
    includeRecommendations?: boolean,
    includeLegalReferences?: boolean,
    includeHistory?: boolean,
    generateCertificate?: boolean,
    correlationId?: string,
  ) {
    super();
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.familyId = familyId;
    this.sections = sections;
    this.includeIssues = includeIssues;
    this.includeRecommendations = includeRecommendations;
    this.includeLegalReferences = includeLegalReferences;
    this.includeHistory = includeHistory;
    this.generateCertificate = generateCertificate;
    this.correlationId = correlationId;
  }

  static create(
    userId: string,
    familyId: string,
    options?: {
      sections?: ComplianceSection[];
      includeIssues?: boolean;
      includeRecommendations?: boolean;
      includeLegalReferences?: boolean;
      includeHistory?: boolean;
      generateCertificate?: boolean;
      correlationId?: string;
    },
  ): GetLegalComplianceQuery {
    const {
      sections = [ComplianceSection.ALL],
      includeIssues = true,
      includeRecommendations = true,
      includeLegalReferences = false,
      includeHistory = false,
      generateCertificate = false,
      correlationId,
    } = options || {};

    return new GetLegalComplianceQuery(
      `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      familyId,
      sections,
      includeIssues,
      includeRecommendations,
      includeLegalReferences,
      includeHistory,
      generateCertificate,
      correlationId,
    );
  }
}
