import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseQuery } from '../base.query';

export enum StatisticsGranularity {
  OVERALL = 'OVERALL',
  BY_BASIS = 'BY_BASIS',
  BY_LEVEL = 'BY_LEVEL',
  BY_CLAIM_STATUS = 'BY_CLAIM_STATUS',
}

export enum TimePeriod {
  ALL_TIME = 'ALL_TIME',
  LAST_YEAR = 'LAST_YEAR',
  LAST_QUARTER = 'LAST_QUARTER',
  LAST_MONTH = 'LAST_MONTH',
  CUSTOM = 'CUSTOM',
}

export class GetDependencyStatisticsQuery extends BaseQuery {
  @IsUUID()
  deceasedId: string;

  @IsOptional()
  @IsEnum(StatisticsGranularity)
  granularity: StatisticsGranularity = StatisticsGranularity.OVERALL;

  @IsOptional()
  @IsEnum(TimePeriod)
  timePeriod: TimePeriod = TimePeriod.ALL_TIME;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  includeFinancialSummary: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeComplianceMetrics: boolean = true;

  @IsOptional()
  @IsUUID()
  comparisonDeceasedId?: string;

  readonly queryId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly userId: string;
  readonly userRole?: string; // Added property

  constructor(
    deceasedId: string,
    options?: {
      granularity?: StatisticsGranularity;
      timePeriod?: TimePeriod;
      startDate?: string;
      endDate?: string;
      includeFinancialSummary?: boolean;
      includeComplianceMetrics?: boolean;
      comparisonDeceasedId?: string;
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
      if (this.timePeriod === TimePeriod.CUSTOM && (!this.startDate || !this.endDate)) {
        const now = new Date();
        this.endDate = now.toISOString();
        now.setFullYear(now.getFullYear() - 1);
        this.startDate = now.toISOString();
      }
    }
  }

  get queryName(): string {
    return 'GetDependencyStatisticsQuery';
  }
}
