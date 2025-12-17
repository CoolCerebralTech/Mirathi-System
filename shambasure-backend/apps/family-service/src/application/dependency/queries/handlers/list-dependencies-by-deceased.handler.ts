// application/dependency/queries/handlers/list-dependencies-by-deceased.handler.ts
import { Injectable } from '@nestjs/common';

import { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { ListDependenciesByDeceasedQuery } from '../impl/list-dependencies-by-deceased.query';
import { BaseQueryHandler, PaginatedQueryHandlerResult } from './base.handler';

@Injectable()
export class ListDependenciesByDeceasedHandler extends BaseQueryHandler<
  ListDependenciesByDeceasedQuery,
  any[]
> {
  constructor(repository: ILegalDependantRepository, mapper: DependencyMapper) {
    super(repository, mapper);
  }

  async execute(query: ListDependenciesByDeceasedQuery): Promise<PaginatedQueryHandlerResult<any>> {
    const startTime = Date.now();

    try {
      // 1. Validate query
      const validation = this.validateQuery(query);
      if (!validation.isValid) {
        return this.createErrorResult(
          'Query validation failed',
          query,
          validation.errors,
          validation.warnings,
          Date.now() - startTime,
        ) as PaginatedQueryHandlerResult<any>;
      }

      // 2. Check permissions
      const permissionCheck = this.checkQueryPermissions(
        { userId: query.userId!, userRole: query.userRole! },
        query,
      );
      if (!permissionCheck.hasPermission) {
        return this.createErrorResult(
          permissionCheck.reason!,
          query,
          ['PERMISSION_DENIED'],
          validation.warnings,
          Date.now() - startTime,
        ) as PaginatedQueryHandlerResult<any>;
      }

      // 3. Execute query with performance monitoring
      const { result, duration } = await this.withPerformanceMonitoring(async () => {
        // Build search criteria
        const criteria = this.buildSearchCriteria(query);

        // For paginated queries, we need both data and total count
        // Assuming repository supports pagination
        // If not, we need to implement pagination logic here

        // Option 1: Repository supports pagination
        // const [dependants, total] = await this.repository.findPaginated(
        //   criteria,
        //   query.skip,
        //   query.take,
        //   query.sortBy,
        //   query.sortDirection,
        // );

        // Option 2: Manual pagination (if repository doesn't support pagination)
        const allDependants = await this.repository.findAllByDeceasedId(query.deceasedId);

        // Apply filters
        let filteredDependants = this.applyFilters(allDependants, query);

        // Apply sorting
        filteredDependants = this.applySorting(filteredDependants, query);

        // Apply pagination
        const total = filteredDependants.length;
        const paginatedDependants = filteredDependants.slice(query.skip, query.skip + query.take);

        return {
          data: paginatedDependants,
          total,
        };
      }, query);

      // 4. Map to responses
      const responses = this.mapper.toDependencyAssessmentResponseList(result.data);

      // 5. Enrich responses if needed
      if (query.includeDependantDetails) {
        await this.enrichResponses(responses, query);
      }

      // 6. Log success
      this.logQueryExecution(query, duration, true);

      return this.createPaginatedSuccessResult(
        responses,
        result.total,
        query,
        'Dependencies listed successfully',
        validation.warnings,
        duration,
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logQueryExecution(query, duration, false, error);

      return this.createErrorResult(
        `Failed to list dependencies: ${error.message}`,
        query,
        ['EXECUTION_ERROR'],
        [],
        duration,
      ) as PaginatedQueryHandlerResult<any>;
    }
  }

  private buildSearchCriteria(query: ListDependenciesByDeceasedQuery): any {
    const criteria: any = {
      deceasedId: query.deceasedId,
    };

    // Apply status filters
    switch (query.status) {
      case 'WITH_COURT_ORDER':
        criteria.provisionOrderIssued = true;
        break;
      case 'WITHOUT_COURT_ORDER':
        criteria.provisionOrderIssued = false;
        break;
      case 'HAS_S26_CLAIM':
        criteria.isClaimant = true;
        break;
      case 'NO_S26_CLAIM':
        criteria.isClaimant = false;
        break;
      case 'S29_COMPLIANT':
        // This would require checking S29 compliance logic
        break;
      case 'NON_S29_COMPLIANT':
        // This would require checking S29 compliance logic
        break;
    }

    // Apply basis filter
    if (query.basis && query.basis !== 'ALL') {
      criteria.dependencyBasis = query.basis;
    }

    // Apply other filters
    if (query.dependencyLevel !== undefined) {
      criteria.dependencyLevel = query.dependencyLevel;
    }

    if (query.isMinor !== undefined) {
      criteria.isMinor = query.isMinor;
    }

    if (query.isStudent !== undefined) {
      criteria.isStudent = query.isStudent;
    }

    if (query.hasDisability !== undefined) {
      criteria.hasDisability = query.hasDisability;
    }

    if (query.hasCourtOrder !== undefined) {
      criteria.provisionOrderIssued = query.hasCourtOrder;
    }

    if (query.isClaimant !== undefined) {
      criteria.isClaimant = query.isClaimant;
    }

    return criteria;
  }

  private applyFilters(dependants: any[], query: ListDependenciesByDeceasedQuery): any[] {
    return dependants.filter((dependant) => {
      // Apply percentage filters
      if (
        query.minDependencyPercentage !== undefined &&
        dependant.dependencyPercentage < query.minDependencyPercentage
      ) {
        return false;
      }

      if (
        query.maxDependencyPercentage !== undefined &&
        dependant.dependencyPercentage > query.maxDependencyPercentage
      ) {
        return false;
      }

      // Apply claim amount filters
      if (
        query.minClaimAmount !== undefined &&
        (!dependant.claimAmount || dependant.claimAmount < query.minClaimAmount)
      ) {
        return false;
      }

      if (
        query.maxClaimAmount !== undefined &&
        dependant.claimAmount &&
        dependant.claimAmount > query.maxClaimAmount
      ) {
        return false;
      }

      // Apply date filters
      if (query.createdAfter) {
        const createdAfter = new Date(query.createdAfter);
        if (dependant.createdAt < createdAfter) {
          return false;
        }
      }

      if (query.createdBefore) {
        const createdBefore = new Date(query.createdBefore);
        if (dependant.createdAt > createdBefore) {
          return false;
        }
      }

      // Apply evidence filters
      if (query.hasEvidence !== undefined) {
        const hasEvidence =
          dependant.dependencyProofDocuments && dependant.dependencyProofDocuments.length > 0;
        if (query.hasEvidence !== hasEvidence) {
          return false;
        }
      }

      if (query.minEvidenceDocuments !== undefined) {
        const evidenceCount = dependant.dependencyProofDocuments?.length || 0;
        if (evidenceCount < query.minEvidenceDocuments) {
          return false;
        }
      }

      // Apply search term filter
      if (query.searchTerm) {
        const searchTerm = query.searchTerm.toLowerCase();
        // Search in dependant ID or other fields
        if (!dependant.dependantId.toLowerCase().includes(searchTerm)) {
          // Could also search in names if available
          return false;
        }
      }

      return true;
    });
  }

  private applySorting(dependants: any[], query: ListDependenciesByDeceasedQuery): any[] {
    return dependants.sort((a, b) => {
      let comparison = 0;

      switch (query.sortBy) {
        case 'dependencyPercentage':
          comparison = a.dependencyPercentage - b.dependencyPercentage;
          break;
        case 'claimAmount':
          comparison = (a.claimAmount || 0) - (b.claimAmount || 0);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'courtOrderDate':
          const dateA = a.courtOrderDate ? new Date(a.courtOrderDate).getTime() : 0;
          const dateB = b.courtOrderDate ? new Date(b.courtOrderDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
      }

      return query.sortDirection === 'DESC' ? -comparison : comparison;
    });
  }

  private async enrichResponses(
    responses: any[],
    query: ListDependenciesByDeceasedQuery,
  ): Promise<void> {
    try {
      // In a real implementation, you would batch fetch additional data
      // For now, we'll simulate enrichment

      for (const response of responses) {
        if (query.includeCourtOrderDetails && response.courtOrderReference) {
          response.courtOrderDetails = {
            courtName: 'High Court of Kenya',
            // ... other details
          };
        }
      }
    } catch (error) {
      this.logger.warn('Failed to enrich responses', error);
    }
  }

  protected checkQueryPermissions(
    metadata: { userId: string; userRole: string },
    query: ListDependenciesByDeceasedQuery,
  ): { hasPermission: boolean; reason?: string } {
    const baseCheck = super.checkQueryPermissions(metadata, query);
    if (!baseCheck.hasPermission) {
      return baseCheck;
    }

    // Check if user can view dependencies for this deceased
    // In practice, you might check if the user is related to the deceased
    // or has court access

    return { hasPermission: true };
  }
}
