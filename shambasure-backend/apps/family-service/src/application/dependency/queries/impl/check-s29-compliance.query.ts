// application/dependency/queries/impl/check-s29-compliance.query.ts
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { BaseQuery } from '../base.query';

export enum ComplianceCheckLevel {
  BASIC = 'BASIC', // Only check essential requirements
  DETAILED = 'DETAILED', // Check all requirements with explanations
  LEGAL = 'LEGAL', // Include legal citations and precedents
}

export enum ComplianceReportFormat {
  SUMMARY = 'SUMMARY', // Brief compliance status
  DETAILED = 'DETAILED', // Detailed report with issues
  LEGAL = 'LEGAL', // Legal opinion format
  EXECUTIVE = 'EXECUTIVE', // Executive summary for non-lawyers
}

export class CheckS29ComplianceQuery extends BaseQuery {
  @IsString()
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
  includeCaseStudies: boolean = false;

  @IsOptional()
  @IsBoolean()
  calculateDistribution: boolean = false;

  @IsOptional()
  @IsBoolean()
  validateAgainstEstateValue: boolean = false;

  @IsOptional()
  @IsNumber()
  estateValue?: number; // Total estate value for validation

  @IsOptional()
  @IsString()
  jurisdiction: string = 'Kenya';

  @IsOptional()
  @IsDateString()
  asOfDate?: string; // Check compliance as of a specific date

  constructor(
    deceasedId: string,
    options?: {
      checkLevel?: ComplianceCheckLevel;
      reportFormat?: ComplianceReportFormat;
      includeRecommendations?: boolean;
      includeLegalCitations?: boolean;
      includeCaseStudies?: boolean;
      calculateDistribution?: boolean;
      validateAgainstEstateValue?: boolean;
      estateValue?: number;
      jurisdiction?: string;
      asOfDate?: string;
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

    // Set default jurisdiction
    if (!this.jurisdiction) {
      this.jurisdiction = 'Kenya';
    }
  }

  get queryName(): string {
    return 'CheckS29ComplianceQuery';
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

    // Validate asOfDate is not in the future
    if (this.asOfDate) {
      const asOfDate = new Date(this.asOfDate);
      const now = new Date();
      if (asOfDate > now) {
        warnings.push('Compliance check date is in the future. Results may not be accurate.');
      }
    }

    // Validate estate value if provided
    if (this.estateValue !== undefined) {
      if (this.estateValue < 0) {
        errors.push('Estate value cannot be negative');
      }
      if (this.estateValue > 10000000000) {
        // 10 billion
        warnings.push('Extremely high estate value detected. Please verify.');
      }
    }

    // Check jurisdiction support
    const supportedJurisdictions = ['Kenya', 'Uganda', 'Tanzania'];
    if (!supportedJurisdictions.includes(this.jurisdiction)) {
      warnings.push(
        `Jurisdiction ${this.jurisdiction} may not be fully supported. Legal interpretations may vary.`,
      );
    }

    // Validate user has appropriate role for legal checks
    if (this.includeLegalCitations && this.userRole && !this.isLegalRole(this.userRole)) {
      warnings.push('User may not have legal expertise to interpret legal citations.');
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

  private isLegalRole(role: string): boolean {
    const legalRoles = ['LAWYER', 'JUDGE', 'REGISTRAR', 'LEGAL_OFFICER', 'PARALEGAL'];
    return legalRoles.includes(role);
  }

  getCheckParameters(): any {
    return {
      deceasedId: this.deceasedId,
      checkLevel: this.checkLevel,
      reportFormat: this.reportFormat,
      includeRecommendations: this.includeRecommendations,
      includeLegalCitations: this.includeLegalCitations,
      includeCaseStudies: this.includeCaseStudies,
      calculateDistribution: this.calculateDistribution,
      validateAgainstEstateValue: this.validateAgainstEstateValue,
      estateValue: this.estateValue,
      jurisdiction: this.jurisdiction,
      asOfDate: this.asOfDate ? new Date(this.asOfDate) : new Date(),
    };
  }

  getDescription(): string {
    let desc = `Check S.29 compliance for deceased ${this.deceasedId} at ${this.checkLevel} level`;

    if (this.calculateDistribution) {
      desc += ' with distribution calculation';
    }

    if (this.validateAgainstEstateValue && this.estateValue) {
      desc += ` against estate value of ${this.estateValue.toLocaleString()} KES`;
    }

    return desc;
  }
}
