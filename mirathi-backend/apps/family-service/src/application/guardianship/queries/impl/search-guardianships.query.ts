// src/application/guardianship/queries/impl/search-guardianships.query.ts
import { GuardianshipStatus } from '../../../../domain/aggregates/guardianship.aggregate';
import { BaseQuery } from '../../../common/base/base.query';
import { IQuery } from '../../../common/interfaces/use-case.interface';

export interface SearchGuardianshipsDto {
  // Pagination
  page: number;
  pageSize: number;

  // Filters
  wardName?: string;
  guardianName?: string;
  status?: GuardianshipStatus | GuardianshipStatus[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // Legal Context
  courtCaseNumber?: string;
  hasOverdueCompliance?: boolean;

  // Sorting
  sortBy?: 'establishedDate' | 'wardName' | 'status' | 'nextComplianceDue';
  sortDirection?: 'ASC' | 'DESC';
}

export class SearchGuardianshipsQuery extends BaseQuery implements IQuery {
  public readonly filters: SearchGuardianshipsDto;

  constructor(
    filters: SearchGuardianshipsDto & {
      userId: string;
      correlationId?: string;
    },
  ) {
    // Destructure to separate BaseQuery props from Filter props
    const { userId, correlationId, ...restFilters } = filters;

    super({ userId, correlationId });

    // Set defaults if missing
    this.filters = {
      ...restFilters,
      page: restFilters.page || 1,
      pageSize: restFilters.pageSize || 20,
    };
  }
}
