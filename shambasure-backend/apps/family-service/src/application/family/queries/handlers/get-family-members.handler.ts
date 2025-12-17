// application/family/queries/handlers/get-family-members.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { Result } from '../../common/result';
import { FamilyMemberResponse } from '../../dto/response/family-member.response';
import { FamilyMemberMapper } from '../../mappers/family-member.mapper';
import {
  FamilyMemberSortField,
  FamilyMemberSortOrder,
  GetFamilyMembersQuery,
} from '../impl/get-family-members.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(GetFamilyMembersQuery)
export class GetFamilyMembersHandler extends BaseQueryHandler<
  GetFamilyMembersQuery,
  Result<PaginatedResponse<FamilyMemberResponse>>
> {
  constructor(
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly familyMemberMapper: FamilyMemberMapper,
    queryBus: any,
  ) {
    super(queryBus);
  }

  async execute(
    query: GetFamilyMembersQuery,
  ): Promise<Result<PaginatedResponse<FamilyMemberResponse>>> {
    try {
      // Validate query
      const validation = this.validateQuery(query);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Build query criteria
      const criteria = this.buildQueryCriteria(query);

      // Get total count
      const total = await this.familyMemberRepository.countByFamilyId(query.familyId);

      // Get paginated members
      const members = await this.familyMemberRepository.findAll(criteria);

      // Apply sorting
      const sortedMembers = this.sortMembers(members, query.sortBy, query.sortOrder);

      // Apply pagination
      const paginatedMembers = this.applyPagination(sortedMembers, query.page, query.limit);

      // Map to DTOs
      const data = this.familyMemberMapper.toDTOList(paginatedMembers);

      // Build paginated response
      const response: PaginatedResponse<FamilyMemberResponse> = {
        data,
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page < Math.ceil(total / query.limit),
        hasPrevious: query.page > 1,
      };

      this.logSuccess(query, response, 'Family members retrieved');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'GetFamilyMembersHandler');
    }
  }

  private buildQueryCriteria(query: GetFamilyMembersQuery): any {
    const criteria: any = {
      familyId: query.familyId,
      isArchived: query.includeArchived ? undefined : false,
    };

    // Apply filters
    if (query.gender) criteria.gender = query.gender;
    if (query.isMinor !== undefined) criteria.isMinor = query.isMinor;
    if (query.hasDisability !== undefined) criteria.hasDisability = query.hasDisability;
    if (query.isIdentityVerified !== undefined)
      criteria.isIdentityVerified = query.isIdentityVerified;
    if (query.polygamousHouseId) criteria.polygamousHouseId = query.polygamousHouseId;
    if (query.occupation) criteria.occupation = query.occupation;

    // Life status filter
    if (query.lifeStatus) {
      switch (query.lifeStatus) {
        case 'LIVING':
          criteria.isDeceased = false;
          break;
        case 'DECEASED':
          criteria.isDeceased = true;
          break;
        case 'MISSING':
          criteria.isMissing = true;
          break;
      }
    }

    // Age range filter
    if (query.minAge !== undefined || query.maxAge !== undefined) {
      // Note: This would require more sophisticated age calculation
      // For now, we'll implement basic filtering
      criteria.ageRange = {
        min: query.minAge,
        max: query.maxAge,
      };
    }

    return criteria;
  }

  private sortMembers(
    members: any[],
    sortBy: FamilyMemberSortField,
    sortOrder: FamilyMemberSortOrder,
  ): any[] {
    return [...members].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case FamilyMemberSortField.NAME:
          const nameA = `${a.name?.firstName || ''} ${a.name?.lastName || ''}`.toLowerCase();
          const nameB = `${b.name?.firstName || ''} ${b.name?.lastName || ''}`.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;

        case FamilyMemberSortField.AGE:
          const ageA = a.currentAge || 0;
          const ageB = b.currentAge || 0;
          comparison = ageA - ageB;
          break;

        case FamilyMemberSortField.CREATED_AT:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;

        case FamilyMemberSortField.UPDATED_AT:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return sortOrder === FamilyMemberSortOrder.DESC ? -comparison : comparison;
    });
  }

  private applyPagination(members: any[], page: number, limit: number): any[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return members.slice(startIndex, endIndex);
  }
}
