import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { GetPolygamyDistributionQuery } from '../impl/get-polygamy-distribution.query';
// Ensure this import matches your file structure for the VM
import {
  HouseGroupVM,
  HouseMemberVM,
  PolygamyDistributionVM,
} from '../read-models/polygamy-distribution.vm';

// or 'polygamy-distribution.vm' if you renamed it

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
        // FIX: Entity uses 'houseHeadId', not 'headOfHouseId'
        // Fallback to originalWifeId if head is undefined (common in S.40 where Wife defines the house)
        const headId = house.props.houseHeadId || house.props.originalWifeId;
        const head = family.getMember(headId);

        // Skip malformed houses (though aggregate validation should prevent this)
        if (!head) continue;

        const houseMembers: HouseMemberVM[] = [];

        // 2a. Add Wives (Iterate IDs stored in House Entity)
        for (const wifeId of house.props.wifeIds) {
          const wife = family.getMember(wifeId);
          if (wife) {
            assignedMemberIds.add(wife.id.toString());
            // Don't add Head twice if Head is the Wife
            if (!wife.id.equals(head.id)) {
              houseMembers.push(this.mapToHouseMember(wife, 'SPOUSE'));
            }
          }
        }

        // 2b. Add Children (Iterate IDs stored in House Entity)
        for (const childId of house.props.childrenIds) {
          const child = family.getMember(childId);
          if (child) {
            assignedMemberIds.add(child.id.toString());
            houseMembers.push(this.mapToHouseMember(child, 'CHILD'));
          }
        }

        // 2c. Calculate Theoretical Share (S.40: Per Stirpes - Equal share per house)
        // We calculate this after collecting all houses, but here we init

        houses.push({
          houseId: house.id.toString(),
          houseName: house.props.houseName,
          order: house.props.houseOrder,
          theoreticalSharePercentage: 0, // Will update below
          headOfHouse: {
            memberId: head.id.toString(),
            name: head.props.name.getFullName(),
            isAlive: head.props.isAlive,
            marriageStatus: head.props.isMarried ? 'MARRIED' : 'SINGLE',
          },
          members: houseMembers,
          memberCount: houseMembers.length + 1, // +1 for Head
          minorCount: houseMembers.filter((m) => m.isMinor).length, // Needed for Trust setup
        });
      }

      // 3. Update Shares
      const houseCount = houses.length;
      if (houseCount > 0) {
        const share = Math.round((100 / houseCount) * 10) / 10;
        houses.forEach((h) => (h.theoreticalSharePercentage = share));
      }

      // 4. Find Unassigned Members (Potential Risks)
      const unassignedMembers: HouseMemberVM[] = [];

      family.props.members.forEach((member) => {
        // Filter logic: Exclude assigned, Exclude Creator (Patriarch), Exclude Head of Family
        if (
          !assignedMemberIds.has(member.id.toString()) &&
          !member.props.isHeadOfFamily &&
          !member.id.equals(family.props.creatorId)
        ) {
          unassignedMembers.push(this.mapToHouseMember(member, 'OTHER'));
        }
      });

      return Result.ok({
        familyId: family.id.toString(),
        isPolygamous: family.isPolygamous(),
        distributionMethod: family.isPolygamous() ? 'PER_STIRPES' : 'PER_CAPITA', // S.40 vs S.38
        totalHouses: houses.length,
        hasUnassignedRisks: unassignedMembers.length > 0,
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
      relationshipToHead: rel === 'CHILD' ? 'CHILD' : rel === 'SPOUSE' ? 'SPOUSE' : 'OTHER',
      age: member.calculateAge() || 0,
      isMinor: member.isMinor(),
      isStudent: member.props.isStudent, // Added from Entity Props
      hasDisability: member.props.hasDisability, // Added from Entity Props
      isEligibleBeneficiary: true, // Default true for direct house members
    };
  }
}
