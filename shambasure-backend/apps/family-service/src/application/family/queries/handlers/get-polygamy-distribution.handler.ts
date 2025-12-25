import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { GetPolygamyDistributionQuery } from '../impl/get-polygamy-distribution.query';
import {
  HouseGroupVM,
  HouseMemberVM,
  PolygamyDistributionVM,
} from '../read-models/polygamy-distribution.vm';

@QueryHandler(GetPolygamyDistributionQuery)
export class GetPolygamyDistributionHandler
  extends BaseQueryHandler<GetPolygamyDistributionQuery, PolygamyDistributionVM>
  implements IQueryHandler<GetPolygamyDistributionQuery, Result<PolygamyDistributionVM>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    private readonly repository: IFamilyRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetPolygamyDistributionQuery): Promise<Result<PolygamyDistributionVM>> {
    try {
      const family = await this.repository.findById(query.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', query.familyId));
      }

      // 1. Prepare Response Containers
      const houses: HouseGroupVM[] = [];
      const assignedMemberIds = new Set<string>();

      // 2. Iterate Defined Houses
      for (const house of family.props.houses) {
        const head = family.getMember(house.props.headOfHouseId);
        if (!head) continue;

        assignedMemberIds.add(head.id.toString());

        // Find children of this House (Usually children of the Head Wife)
        const children = family.getChildren(head.id);
        const houseMembers: HouseMemberVM[] = children.map((child) => {
          assignedMemberIds.add(child.id.toString());
          return this.mapToHouseMember(child, 'CHILD');
        });

        // Add Head as member (or separate field)
        // Note: The VM has headOfHouse as a distinct field

        houses.push({
          houseId: house.id.toString(),
          houseName: house.props.houseName,
          order: house.props.houseOrder,
          headOfHouse: {
            memberId: head.id.toString(),
            name: head.props.name.getFullName(),
            isAlive: head.props.isAlive,
            marriageStatus: head.props.isMarried ? 'MARRIED' : 'SINGLE',
          },
          members: houseMembers,
          memberCount: houseMembers.length + 1, // +1 for Head
        });
      }

      // 3. Find Unassigned Members (Potential Risks)
      const unassignedMembers: HouseMemberVM[] = [];

      // Filter logic: Exclude Creator, Exclude already assigned
      family.props.members.forEach((member) => {
        if (!assignedMemberIds.has(member.id.toString()) && !member.props.isHeadOfFamily) {
          unassignedMembers.push(this.mapToHouseMember(member, 'OTHER'));
        }
      });

      return Result.ok({
        familyId: family.id.toString(),
        isPolygamous: family.isPolygamous(),
        houses: houses.sort((a, b) => a.order - b.order),
        unassignedMembers,
      });
    } catch (error) {
      return this.handleError(error, query);
    }
  }

  private mapToHouseMember(member: FamilyMember, rel: 'CHILD' | 'SPOUSE' | 'OTHER'): HouseMemberVM {
    return {
      memberId: member.id.toString(),
      name: member.props.name.getFullName(),
      relationshipToHead: rel,
      age: member.calculateAge() || 0,
      isMinor: member.isMinor(),
    };
  }
}
