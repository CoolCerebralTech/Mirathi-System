import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../../common/base/result';
import { FamilySearchResponse } from '../../dto/response/family-search.response';
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
  FamilySearchResponse
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMapper: FamilyMapper,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: SearchFamiliesQuery): Promise<Result<FamilySearchResponse>> {
    try {
      const validation = this.validateQuery(query);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 1. Build Criteria
      const criteria = this.buildSearchCriteria(query);

      // 2. Fetch Data (Repo returns Domain Entities)
      const total = await this.familyRepository.count(criteria);
      const allMatchingFamilies = await this.familyRepository.findAll(criteria);

      // 3. Sort
      const sortedFamilies = this.sortFamilies(
        allMatchingFamilies,
        query.sortBy || FamilySortField.NAME,
        query.sortOrder || FamilySortOrder.ASC,
      );

      // 4. Paginate
      const page = query.page || 1;
      const limit = query.limit || 20;
      const paginatedFamilies = this.applyPagination(sortedFamilies, page, limit);

      // 5. Map
      const data = this.familyMapper.toDTOList(paginatedFamilies);

      // 6. Statistics (Optional)
      let statistics = {};
      if (query.includeStatistics) {
        statistics = this.calculateSearchStatistics(query, total);
      }

      // 7. Response
      const response: FamilySearchResponse = {
        data,
        page: page,
        limit: limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
        query: this.buildQueryString(query),
        filters: this.extractFilters(query),
        // Placeholders for aggregated stats usually fetched via specific repository methods
        totalActiveFamilies: 0,
        totalPolygamousFamilies: 0,
        averageFamilySize: 0,
        familiesByCounty: {},
        executionTimeMs: 0,
        ...statistics, // Spread optional stats
      };

      this.logSuccess(query, undefined, 'Families search completed');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'SearchFamiliesHandler');
    }
  }

  private buildSearchCriteria(query: SearchFamiliesQuery): Record<string, any> {
    const criteria: Record<string, any> = {};

    if (query.search) criteria.search = query.search;
    if (query.clanName) criteria.clanName = query.clanName;
    if (query.ancestralHome) criteria.ancestralHome = query.ancestralHome;
    if (query.county) criteria.homeCounty = query.county;
    if (query.subCounty) criteria.subCounty = query.subCounty;

    if (query.isPolygamous !== undefined) criteria.isPolygamous = query.isPolygamous;
    if (query.isActive !== undefined) criteria.isActive = query.isActive;
    if (query.isArchived !== undefined) criteria.isArchived = query.isArchived;

    if (query.familyTotem) criteria.familyTotem = query.familyTotem;

    // Member count range
    if (query.minMemberCount !== undefined || query.maxMemberCount !== undefined) {
      criteria.memberCountRange = {
        min: query.minMemberCount,
        max: query.maxMemberCount,
      };
    }

    if (query.creatorId) criteria.creatorId = query.creatorId;
    if (query.familyIds && query.familyIds.length > 0) criteria.ids = query.familyIds;

    // Advanced boolean filters
    if (query.hasLivingMembers !== undefined) criteria.hasLivingMembers = query.hasLivingMembers;
    if (query.hasMinors !== undefined) criteria.hasMinors = query.hasMinors;
    if (query.hasDependants !== undefined) criteria.hasDependants = query.hasDependants;

    return criteria;
  }

  private sortFamilies(
    families: Family[],
    sortBy: FamilySortField,
    sortOrder: FamilySortOrder,
  ): Family[] {
    return [...families].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case FamilySortField.NAME:
          comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          break;
        case FamilySortField.MEMBER_COUNT:
          comparison = a.memberCount - b.memberCount;
          break;
        case FamilySortField.CREATED_AT:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case FamilySortField.UPDATED_AT:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case FamilySortField.COUNTY: {
          const cA = a.homeCounty || '';
          const cB = b.homeCounty || '';
          comparison = cA.localeCompare(cB);
          break;
        }
      }

      return sortOrder === FamilySortOrder.DESC ? -comparison : comparison;
    });
  }

  private applyPagination(families: Family[], page: number, limit: number): Family[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return families.slice(startIndex, endIndex);
  }

  private buildQueryString(query: SearchFamiliesQuery): string {
    const params = new URLSearchParams();
    if (query.search) params.append('search', query.search);
    if (query.clanName) params.append('clanName', query.clanName);
    if (query.county) params.append('county', query.county);
    if (query.page) params.append('page', query.page.toString());
    return params.toString();
  }

  private extractFilters(query: SearchFamiliesQuery): Record<string, any> {
    // Simple extraction for response metadata
    const filters: Record<string, any> = {};
    if (query.search) filters.search = query.search;
    if (query.isPolygamous !== undefined) filters.isPolygamous = query.isPolygamous;
    return filters;
  }

  // Fixed: Removed async
  private calculateSearchStatistics(query: SearchFamiliesQuery, totalResults: number): any {
    return {
      searchStats: {
        totalFound: totalResults,
        timestamp: new Date(),
      },
    };
  }
}
