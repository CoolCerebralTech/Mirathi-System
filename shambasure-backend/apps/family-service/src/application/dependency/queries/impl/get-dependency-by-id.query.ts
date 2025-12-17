// application/dependency/queries/impl/get-dependency-by-id.query.ts
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { BaseQuery } from '../base.query';

export class GetDependencyByIdQuery extends BaseQuery {
  @IsString()
  dependencyId: string;

  @IsOptional()
  @IsBoolean()
  includeDeceasedDetails: boolean = false;

  @IsOptional()
  @IsBoolean()
  includeDependantDetails: boolean = false;

  @IsOptional()
  @IsBoolean()
  includeEvidenceDocuments: boolean = false;

  @IsOptional()
  @IsBoolean()
  includeCourtOrderDetails: boolean = false;

  @IsOptional()
  @IsBoolean()
  includeAuditHistory: boolean = false;

  constructor(
    dependencyId: string,
    options?: {
      includeDeceasedDetails?: boolean;
      includeDependantDetails?: boolean;
      includeEvidenceDocuments?: boolean;
      includeCourtOrderDetails?: boolean;
      includeAuditHistory?: boolean;
      requestId?: string;
      correlationId?: string;
      userId?: string;
      userRole?: string;
    },
  ) {
    super();

    this.dependencyId = dependencyId;

    if (options) {
      this.includeDeceasedDetails = options.includeDeceasedDetails ?? false;
      this.includeDependantDetails = options.includeDependantDetails ?? false;
      this.includeEvidenceDocuments = options.includeEvidenceDocuments ?? false;
      this.includeCourtOrderDetails = options.includeCourtOrderDetails ?? false;
      this.includeAuditHistory = options.includeAuditHistory ?? false;
      this.requestId = options.requestId;
      this.correlationId = options.correlationId;
      this.userId = options.userId;
      this.userRole = options.userRole;
    }
  }

  get queryName(): string {
    return 'GetDependencyByIdQuery';
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.dependencyId) {
      errors.push('Dependency ID is required');
    }

    if (this.dependencyId && !this.isValidUUID(this.dependencyId)) {
      errors.push('Invalid dependency ID format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidUUID(id: string): boolean {
    // Simple UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id) || id.startsWith('dep-'); // Allow our custom IDs too
  }

  getDescription(): string {
    return `Get dependency assessment by ID: ${this.dependencyId}`;
  }
}
