import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { BaseQuery } from '../base.query';

export enum ComplianceCheckLevel {
  BASIC = 'BASIC',
  DETAILED = 'DETAILED',
  LEGAL = 'LEGAL',
}

export enum ComplianceReportFormat {
  SUMMARY = 'SUMMARY',
  DETAILED = 'DETAILED',
  LEGAL_OPINION = 'LEGAL_OPINION',
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
}

export class CheckS29ComplianceQuery extends BaseQuery {
  @IsUUID()
  deceasedId: string;

  @IsOptional()
  @IsEnum(ComplianceCheckLevel)
  checkLevel: ComplianceCheckLevel = ComplianceCheckLevel.DETAILED;

  @IsOptional()
  @IsEnum(ComplianceReportFormat)
  reportFormat: ComplianceReportFormat = ComplianceReportFormat.DETAILED;

  @IsOptional()
  @IsBoolean()
  includeRecommendations: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeLegalCitations: boolean = false;

  @IsOptional()
  @IsBoolean()
  calculateDistribution: boolean = false;

  @IsOptional()
  @IsBoolean()
  validateAgainstEstateValue: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estateValue?: number;

  @IsOptional()
  @IsString()
  jurisdiction: string = 'Kenya';

  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  readonly queryId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly userId: string;
  readonly userRole?: string; // Added property

  constructor(
    deceasedId: string,
    options?: {
      checkLevel?: ComplianceCheckLevel;
      reportFormat?: ComplianceReportFormat;
      includeRecommendations?: boolean;
      includeLegalCitations?: boolean;
      calculateDistribution?: boolean;
      validateAgainstEstateValue?: boolean;
      estateValue?: number;
      jurisdiction?: string;
      asOfDate?: string;
      requestId?: string;
      correlationId?: string;
      userId?: string;
      userRole?: string; // Added to options interface
    },
  ) {
    super();

    this.deceasedId = deceasedId;
    this.queryId = options?.requestId || crypto.randomUUID();
    this.timestamp = new Date();
    this.correlationId = options?.correlationId;
    this.userId = options?.userId || 'SYSTEM';
    this.userRole = options?.userRole;

    if (options) {
      Object.assign(this, options);
    }

    if (!this.jurisdiction) {
      this.jurisdiction = 'Kenya';
    }
  }

  get queryName(): string {
    return 'CheckS29ComplianceQuery';
  }
}
