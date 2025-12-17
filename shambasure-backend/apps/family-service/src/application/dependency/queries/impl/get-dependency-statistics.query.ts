// application/dependency/queries/impl/get-dependency-statistics.query.ts
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { BaseQuery } from '../base.query';

export enum StatisticsGranularity {
  OVERALL = 'OVERALL',
  BY_DEPENDENCY_BASIS = 'BY_DEPENDENCY_BASIS',
  BY_DEPENDENCY_LEVEL = 'BY_DEPENDENCY_LEVEL',
  BY_CLAIM_STATUS = 'BY_CLAIM_STATUS',
  BY_DISABILITY_STATUS = 'BY_DISABILITY_STATUS',
  BY_AGE_GROUP = 'BY_AGE_GROUP',
}

export enum TimePeriod {
  ALL_TIME = 'ALL_TIME',
  LAST_YEAR = 'LAST_YEAR',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  LAST_3_MONTHS = 'LAST_3_MONTHS',
  LAST_MONTH = 'LAST_MONTH',
  CUSTOM = 'CUSTOM',
}

export class GetDependencyStatisticsQuery extends BaseQuery {
  @IsString()
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
  includeTrends: boolean = false;

  @IsOptional()
  @IsBoolean()
  includeComparisons: boolean = false;

  @IsOptional()
  @IsBoolean()
  includeFinancialSummary: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeLegalCompliance: boolean = true;

  @IsOptional()
  @IsString()
  comparisonDeceasedId?: string; // Compare with another deceased's statistics

  @IsOptional()
  @IsBoolean()
  exportToCsv: boolean = false;

  @IsOptional()
  @IsString()
  exportFormat: string = 'json';

  constructor(
    deceasedId: string,
    options?: {
      granularity?: StatisticsGranularity;
      timePeriod?: TimePeriod;
      startDate?: string;
      endDate?: string;
      includeTrends?: boolean;
      includeComparisons?: boolean;
      includeFinancialSummary?: boolean;
      includeLegalCompliance?: boolean;
      comparisonDeceasedId?: string;
      exportToCsv?: boolean;
      exportFormat?: string;
      requestId?: string;
      correlationId?: string;
      userId?: string;
      userRole?: string;
    },
  ) {
    super();

    this.deceasedId = deceasedId;

    if (options) {
      Object.assign(this, options);
      this.requestId = options.requestId;
      this.correlationId = options.correlationId;
      this.userId = options.userId;
      this.userRole = options.userRole;
    }

    // Set default dates based on time period
    if (
      !this.startDate &&
      this.timePeriod !== TimePeriod.ALL_TIME &&
      this.timePeriod !== TimePeriod.CUSTOM
    ) {
      this.setDefaultDates();
    }
  }

  get queryName(): string {
    return 'GetDependencyStatisticsQuery';
  }

  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.deceasedId) {
      errors.push('Deceased ID is required');
    }

    if (this.deceasedId && !this.isValidUUID(this.deceasedId)) {
      warnings.push('Invalid deceased ID format');
    }

    // Validate date range for custom period
    if (this.timePeriod === TimePeriod.CUSTOM) {
      if (!this.startDate || !this.endDate) {
        errors.push('Both startDate and endDate are required for custom time period');
      } else {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);

        if (start > end) {
          errors.push('Start date cannot be after end date');
        }

        if (end > new Date()) {
          warnings.push('End date is in the future. Statistics may be incomplete.');
        }

        // Check if range is too large
        const diffInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffInDays > 365 * 5) {
          // 5 years
          warnings.push('Very large date range selected. Query performance may be affected.');
        }
      }
    }

    // Validate comparison deceased ID
    if (this.comparisonDeceasedId && !this.isValidUUID(this.comparisonDeceasedId)) {
      warnings.push('Invalid comparison deceased ID format');
    }

    // Validate export format
    if (this.exportToCsv && this.exportFormat !== 'csv') {
      warnings.push('Export format may not match export type');
    }

    // Check user permissions for comparisons
    if (
      this.includeComparisons &&
      this.userRole &&
      !this.isAuthorizedForComparisons(this.userRole)
    ) {
      warnings.push('User may not have permission to view comparative statistics');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  private isAuthorizedForComparisons(role: string): boolean {
    const authorizedRoles = ['ADMIN', 'RESEARCHER', 'ANALYST', 'SUPERVISOR'];
    return authorizedRoles.includes(role);
  }

  private setDefaultDates(): void {
    const endDate = new Date();
    const startDate = new Date();

    switch (this.timePeriod) {
      case TimePeriod.LAST_YEAR:
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case TimePeriod.LAST_6_MONTHS:
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case TimePeriod.LAST_3_MONTHS:
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case TimePeriod.LAST_MONTH:
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    this.startDate = startDate.toISOString().split('T')[0];
    this.endDate = endDate.toISOString().split('T')[0];
  }

  getDateRange(): { startDate: Date; endDate: Date } {
    let startDate: Date;
    let endDate: Date = new Date();

    if (this.timePeriod === TimePeriod.CUSTOM && this.startDate && this.endDate) {
      startDate = new Date(this.startDate);
      endDate = new Date(this.endDate);
    } else {
      // Use default ranges based on timePeriod
      startDate = new Date();

      switch (this.timePeriod) {
        case TimePeriod.LAST_YEAR:
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case TimePeriod.LAST_6_MONTHS:
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case TimePeriod.LAST_3_MONTHS:
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case TimePeriod.LAST_MONTH:
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case TimePeriod.ALL_TIME:
          startDate = new Date(0); // Beginning of time
          break;
        default:
          startDate = new Date(0);
      }
    }

    return { startDate, endDate };
  }

  getDescription(): string {
    let desc = `Get dependency statistics for deceased ${this.deceasedId} with ${this.granularity} granularity`;

    if (this.timePeriod !== TimePeriod.ALL_TIME) {
      desc += ` for ${this.timePeriod}`;
    }

    if (this.includeComparisons && this.comparisonDeceasedId) {
      desc += ` compared to deceased ${this.comparisonDeceasedId}`;
    }

    return desc;
  }
}
