import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
// Adjusted path
import { Result } from '../../../common/base/result';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
// Adjusted path
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
  PaginatedResponse<FamilyMemberResponse>
> {
  constructor(
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly familyMemberMapper: FamilyMemberMapper,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(
    query: GetFamilyMembersQuery,
  ): Promise<Result<PaginatedResponse<FamilyMemberResponse>>> {
    try {
      const validation = this.validateQuery(query);
      if (validation.isFailure) {
        return Result.fail(validation.error!);
      }

      // 1. Build Criteria
      const criteria = this.buildQueryCriteria(query);

      // 2. Fetch All Matching Members (In-memory manipulation for Domain Entities)
      // Note: In a read-heavy system, we might use a separate Read Model/Projection
      const allMatchingMembers = await this.familyMemberRepository.findAll(criteria);

      // 3. Sort
      const sortedMembers = this.sortMembers(
        allMatchingMembers,
        query.sortBy || FamilyMemberSortField.NAME,
        query.sortOrder || FamilyMemberSortOrder.ASC,
      );

      // 4. Paginate
      const page = query.page || 1;
      const limit = query.limit || 20;
      const total = sortedMembers.length;

      const paginatedMembers = this.applyPagination(sortedMembers, page, limit);

      // 5. Map to DTOs
      const data = this.familyMemberMapper.toDTOList(paginatedMembers);

      // 6. Build Response
      const response: PaginatedResponse<FamilyMemberResponse> = {
        data,
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      };

      this.logSuccess(query, undefined, 'Family members retrieved');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'GetFamilyMembersHandler');
    }
  }

  private buildQueryCriteria(query: GetFamilyMembersQuery): Record<string, any> {
    const criteria: Record<string, any> = {
      familyId: query.familyId,
    };

    // Handle Archive Status
    if (!query.includeArchived) {
      criteria.isArchived = false;
    }

    // Direct filters
    if (query.gender) criteria.gender = query.gender;
    if (query.isMinor !== undefined) criteria.isMinor = query.isMinor;
    if (query.hasDisability !== undefined) criteria.hasDisability = query.hasDisability;
    if (query.isIdentityVerified !== undefined)
      criteria.isIdentityVerified = query.isIdentityVerified;
    if (query.polygamousHouseId) criteria.polygamousHouseId = query.polygamousHouseId;
    if (query.occupation) criteria.occupation = query.occupation;
    if (query.memberIds && query.memberIds.length > 0) criteria.ids = query.memberIds;

    // Search (Name search usually handled by Repo, passing param here)
    if (query.search) criteria.search = query.search;

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
          criteria.isMissing = true; // Assuming entity/repo supports this flag
          break;
      }
    }

    // Age range (Repo needs to handle range logic)
    if (query.minAge !== undefined || query.maxAge !== undefined) {
      criteria.ageRange = {
        min: query.minAge,
        max: query.maxAge,
      };
    }

    return criteria;
  }

  private sortMembers(
    members: FamilyMember[],
    sortBy: FamilyMemberSortField,
    sortOrder: FamilyMemberSortOrder,
  ): FamilyMember[] {
    // Clone to avoid mutating the original array
    return [...members].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case FamilyMemberSortField.NAME:
          // Use VO values
          const nameA = a.name.fullName.toLowerCase();
          const nameB = b.name.fullName.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;

        case FamilyMemberSortField.AGE:
          // Handle null ages (unknown age comes last in ASC, first in DESC usually)
          const ageA = a.currentAge ?? -1;
          const ageB = b.currentAge ?? -1;
          comparison = ageA - ageB;
          break;

        case FamilyMemberSortField.CREATED_AT:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;

        case FamilyMemberSortField.UPDATED_AT:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }

      return sortOrder === FamilyMemberSortOrder.DESC ? -comparison : comparison;
    });
  }

  private applyPagination(members: FamilyMember[], page: number, limit: number): FamilyMember[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return members.slice(startIndex, endIndex);
  }
}
