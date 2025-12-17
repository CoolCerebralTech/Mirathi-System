// application/family/queries/handlers/search-families.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { Result } from '../../common/result';
import { FamilySearchResponse } from '../../dto/response/family-search.response';
import { FamilyResponse } from '../../dto/response/family.response';
import { FamilyMapper } from '../../mappers/family.mapper';
import {
  FamilySortField,
  FamilySortOrder,
  SearchFamiliesQuery,
} from '../impl/search-families.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(SearchFamiliesQuery)
export class SearchFamiliesHandler extends BaseQueryHandler<
  SearchFamiliesQuery,
  Result<FamilySearchResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMapper: FamilyMapper,
    queryBus: any,
  ) {
    super(queryBus);
  }

  async execute(query: SearchFamiliesQuery): Promise<Result<FamilySearchResponse>> {
    try {
      // Validate query
      const validation = this.validateQuery(query);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Build search criteria
      const criteria = this.buildSearchCriteria(query);

      // Get total count
      const total = await this.familyRepository.count(criteria);

      // Get paginated families
      const families = await this.familyRepository.findAll(criteria);

      // Apply sorting
      const sortedFamilies = this.sortFamilies(families, query.sortBy, query.sortOrder);

      // Apply pagination
      const paginatedFamilies = this.applyPagination(sortedFamilies, query.page, query.limit);

      // Map to DTOs
      const data = this.familyMapper.toDTOList(paginatedFamilies);

      // Get statistics if requested
      let statistics = null;
      if (query.includeStatistics) {
        statistics = await this.calculateSearchStatistics(query, total);
      }

      // Build response
      const response: FamilySearchResponse = {
        data,
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page < Math.ceil(total / query.limit),
        hasPrevious: query.page > 1,
        query: this.buildQueryString(query),
        filters: this.extractFilters(query),
        totalActiveFamilies: await this.getTotalActiveFamilies(),
        totalPolygamousFamilies: await this.getTotalPolygamousFamilies(),
        averageFamilySize: await this.getAverageFamilySize(),
        familiesByCounty: await this.getFamiliesByCounty(),
        executionTimeMs: 0, // Would be calculated based on actual execution time
      };

      if (statistics) {
        Object.assign(response, statistics);
      }

      this.logSuccess(query, response, 'Families search completed');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'SearchFamiliesHandler');
    }
  }

  private buildSearchCriteria(query: SearchFamiliesQuery): any {
    const criteria: any = {};

    if (query.search) {
      criteria.search = query.search;
    }

    if (query.clanName) {
      criteria.clanName = query.clanName;
    }

    if (query.ancestralHome) {
      criteria.ancestralHome = query.ancestralHome;
    }

    if (query.county) {
      criteria.homeCounty = query.county;
    }

    if (query.subCounty) {
      criteria.subCounty = query.subCounty;
    }

    if (query.isPolygamous !== undefined) {
      criteria.isPolygamous = query.isPolygamous;
    }

    if (query.isActive !== undefined) {
      criteria.isActive = query.isActive;
    }

    if (query.isArchived !== undefined) {
      criteria.isArchived = query.isArchived;
    }

    if (query.familyTotem) {
      criteria.familyTotem = query.familyTotem;
    }

    if (query.minMemberCount !== undefined) {
      criteria.minMemberCount = query.minMemberCount;
    }

    if (query.maxMemberCount !== undefined) {
      criteria.maxMemberCount = query.maxMemberCount;
    }

    if (query.creatorId) {
      criteria.creatorId = query.creatorId;
    }

    if (query.familyIds && query.familyIds.length > 0) {
      criteria.familyIds = query.familyIds;
    }

    if (query.hasLivingMembers !== undefined) {
      criteria.hasLivingMembers = query.hasLivingMembers;
    }

    if (query.hasMinors !== undefined) {
      criteria.hasMinors = query.hasMinors;
    }

    if (query.hasDependants !== undefined) {
      criteria.hasDependants = query.hasDependants;
    }

    return criteria;
  }

  private sortFamilies(
    families: any[],
    sortBy: FamilySortField,
    sortOrder: FamilySortOrder,
  ): any[] {
    return [...families].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case FamilySortField.NAME:
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;

        case FamilySortField.MEMBER_COUNT:
          comparison = a.memberCount - b.memberCount;
          break;

        case FamilySortField.CREATED_AT:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;

        case FamilySortField.UPDATED_AT:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;

        case FamilySortField.COUNTY:
          const countyA = a.homeCounty || '';
          const countyB = b.homeCounty || '';
          comparison = countyA.localeCompare(countyB);
          break;
      }

      return sortOrder === FamilySortOrder.DESC ? -comparison : comparison;
    });
  }

  private applyPagination(families: any[], page: number, limit: number): any[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return families.slice(startIndex, endIndex);
  }

  private buildQueryString(query: SearchFamiliesQuery): string {
    const params = new URLSearchParams();

    if (query.search) params.append('search', query.search);
    if (query.clanName) params.append('clanName', query.clanName);
    if (query.county) params.append('county', query.county);
    if (query.isPolygamous !== undefined)
      params.append('isPolygamous', query.isPolygamous.toString());
    if (query.isActive !== undefined) params.append('isActive', query.isActive.toString());
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());

    return params.toString();
  }

  private extractFilters(query: SearchFamiliesQuery): Record<string, any> {
    const filters: Record<string, any> = {};

    if (query.search) filters.search = query.search;
    if (query.clanName) filters.clanName = query.clanName;
    if (query.county) filters.county = query.county;
    if (query.isPolygamous !== undefined) filters.isPolygamous = query.isPolygamous;
    if (query.isActive !== undefined) filters.isActive = query.isActive;
    if (query.isArchived !== undefined) filters.isArchived = query.isArchived;

    return filters;
  }

  private async calculateSearchStatistics(
    query: SearchFamiliesQuery,
    totalResults: number,
  ): Promise<any> {
    // This would be more comprehensive in production
    return {
      searchCriteria: {
        hasFilters: query.hasFilters,
        filterCount: Object.keys(this.extractFilters(query)).length,
      },
      resultSummary: {
        totalResults,
        hasResults: totalResults > 0,
      },
    };
  }

  private async getTotalActiveFamilies(): Promise<number> {
    // This would query the database for active families
    // For now, return a placeholder
    return 1000;
  }

  private async getTotalPolygamousFamilies(): Promise<number> {
    // This would query the database for polygamous families
    // For now, return a placeholder
    return 150;
  }

  private async getAverageFamilySize(): Promise<number> {
    // This would calculate average family size
    // For now, return a placeholder
    return 8.5;
  }

  private async getFamiliesByCounty(): Promise<Record<string, number>> {
    // This would group families by county
    // For now, return placeholder data
    return {
      KIAMBU: 200,
      NAIROBI: 150,
      NAKURU: 100,
      MOMBASA: 80,
      KISUMU: 70,
      UASIN_GISHU: 60,
    };
  }
}
