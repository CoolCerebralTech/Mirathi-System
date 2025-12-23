import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

import { BaseQuery } from '../base.query';

export class GetDependencyByIdQuery extends BaseQuery {
  @IsUUID()
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

  readonly queryId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly userId: string;
  readonly userRole?: string; // Added property

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
      userRole?: string; // Added to options interface
    },
  ) {
    super();

    this.dependencyId = dependencyId;
    this.queryId = options?.requestId || crypto.randomUUID();
    this.timestamp = new Date();
    this.correlationId = options?.correlationId;
    this.userId = options?.userId || 'SYSTEM';
    this.userRole = options?.userRole;

    if (options) {
      this.includeDeceasedDetails = options.includeDeceasedDetails ?? false;
      this.includeDependantDetails = options.includeDependantDetails ?? false;
      this.includeEvidenceDocuments = options.includeEvidenceDocuments ?? false;
      this.includeCourtOrderDetails = options.includeCourtOrderDetails ?? false;
      this.includeAuditHistory = options.includeAuditHistory ?? false;
    }
  }

  get queryName(): string {
    return 'GetDependencyByIdQuery';
  }
}
