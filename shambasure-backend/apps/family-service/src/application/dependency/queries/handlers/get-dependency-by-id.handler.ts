// application/dependency/queries/handlers/get-dependency-by-id.handler.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { GetDependencyByIdQuery } from '../impl/get-dependency-by-id.query';
import { BaseQueryHandler, QueryHandlerResult } from './base.handler';

@Injectable()
export class GetDependencyByIdHandler extends BaseQueryHandler<GetDependencyByIdQuery, any> {
  constructor(repository: ILegalDependantRepository, mapper: DependencyMapper) {
    super(repository, mapper);
  }

  async execute(query: GetDependencyByIdQuery): Promise<QueryHandlerResult> {
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
        );
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
        );
      }

      // 3. Execute query with performance monitoring
      const { result: dependant, duration } = await this.withPerformanceMonitoring(async () => {
        // Check cache first if enabled
        // const cached = await this.cacheService.get(this.generateCacheKey(query));
        // if (cached) return cached;

        // Fetch from repository
        const result = await this.repository.findById(query.dependencyId);

        if (!result) {
          throw new NotFoundException(
            `Dependency assessment not found with ID: ${query.dependencyId}`,
          );
        }

        // Cache the result if needed
        // if (this.shouldCache(query)) {
        //   await this.cacheService.set(
        //     this.generateCacheKey(query),
        //     result,
        //     this.getCacheTTL(query),
        //   );
        // }

        return result;
      }, query);

      // 4. Map to response
      const response = this.mapper.toDependencyAssessmentResponse(dependant);

      // 5. Fetch additional data if requested
      if (query.includeDeceasedDetails || query.includeDependantDetails) {
        await this.enrichResponse(response, query);
      }

      // 6. Log success
      this.logQueryExecution(query, duration, true);

      return this.createSuccessResult(
        response,
        'Dependency assessment retrieved successfully',
        query,
        validation.warnings,
        duration,
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logQueryExecution(query, duration, false, error);

      if (error instanceof NotFoundException) {
        return this.createErrorResult(error.message, query, ['DEPENDENCY_NOT_FOUND'], [], duration);
      }

      return this.createErrorResult(
        `Failed to retrieve dependency assessment: ${error.message}`,
        query,
        ['EXECUTION_ERROR'],
        [],
        duration,
      );
    }
  }

  private async enrichResponse(response: any, query: GetDependencyByIdQuery): Promise<void> {
    try {
      // In a real implementation, you would fetch additional data from other services/repositories
      // For now, we'll simulate enrichment

      if (query.includeDeceasedDetails) {
        response.deceasedDetails = {
          // This would come from a person service
          name: 'John Doe (Simulated)',
          dateOfBirth: '1970-01-01',
          dateOfDeath: '2024-01-01',
          // ... other details
        };
      }

      if (query.includeDependantDetails) {
        response.dependantDetails = {
          // This would come from a person service
          name: 'Jane Smith (Simulated)',
          dateOfBirth: '1990-05-15',
          relationship: response.dependencyBasis,
          // ... other details
        };
      }

      if (query.includeCourtOrderDetails && response.courtOrderReference) {
        response.courtOrderDetails = {
          // This would come from a court service
          courtName: 'High Court of Kenya',
          judgeName: 'Hon. Justice Simulated',
          hearingDate: '2024-02-01',
          // ... other details
        };
      }
    } catch (error) {
      this.logger.warn('Failed to enrich response', error);
      // Don't fail the query if enrichment fails
    }
  }

  protected checkQueryPermissions(
    metadata: { userId: string; userRole: string },
    query: GetDependencyByIdQuery,
  ): { hasPermission: boolean; reason?: string } {
    // Base permission check
    const baseCheck = super.checkQueryPermissions(metadata, query);
    if (!baseCheck.hasPermission) {
      return baseCheck;
    }

    // Additional permission logic specific to this query
    // In practice, you might check if the user has access to this specific dependency
    // For example, only court officials can see certain details

    // Check if user can view evidence documents
    if (query.includeEvidenceDocuments && !this.canViewEvidence(metadata.userRole)) {
      return {
        hasPermission: false,
        reason: 'User role cannot view evidence documents',
      };
    }

    // Check if user can view audit history
    if (query.includeAuditHistory && !this.canViewAuditHistory(metadata.userRole)) {
      return {
        hasPermission: false,
        reason: 'User role cannot view audit history',
      };
    }

    return { hasPermission: true };
  }

  private canViewEvidence(userRole: string): boolean {
    const allowedRoles = ['JUDGE', 'REGISTRAR', 'LAWYER', 'ADMIN'];
    return allowedRoles.includes(userRole);
  }

  private canViewAuditHistory(userRole: string): boolean {
    const allowedRoles = ['ADMIN', 'AUDITOR', 'SUPERVISOR'];
    return allowedRoles.includes(userRole);
  }
}
