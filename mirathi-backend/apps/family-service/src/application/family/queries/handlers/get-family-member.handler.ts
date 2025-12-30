import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { RelationshipType } from '../../../../domain/value-objects/family-enums.vo';
import { AppErrors } from '../../../common/application.error';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { GetFamilyMemberQuery } from '../impl/get-family-member.query';
import { FamilyMemberProfileVM } from '../read-models/family-member-profile.vm';

@QueryHandler(GetFamilyMemberQuery)
export class GetFamilyMemberHandler
  extends BaseQueryHandler<GetFamilyMemberQuery, FamilyMemberProfileVM>
  implements IQueryHandler<GetFamilyMemberQuery, Result<FamilyMemberProfileVM>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    private readonly repository: IFamilyRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetFamilyMemberQuery): Promise<Result<FamilyMemberProfileVM>> {
    try {
      // 1. Load the Family Aggregate
      const family = await this.repository.findById(query.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', query.familyId));
      }

      // 2. Find the Target Member
      const memberId = new UniqueEntityID(query.memberId);
      const member = family.getMember(memberId);

      if (!member) {
        return Result.fail(new AppErrors.NotFoundError('Family Member', query.memberId));
      }

      // 3. Resolve Kinship Links
      const parents = family.getParents(memberId);
      const children = family.getChildren(memberId);
      const siblings = family.getSiblings(memberId);
      const spouses = family.getSpouses(memberId);

      // 4. Determine Polygamous Context (S.40)
      const house = family.props.houses.find(
        (h) =>
          h.props.wifeIds.some((id) => id.equals(memberId)) ||
          h.props.childrenIds.some((id) => id.equals(memberId)),
      );

      // FIX: Safe check for houseHeadId
      const isHouseHead =
        house && house.props.houseHeadId ? house.props.houseHeadId.equals(member.id) : false;

      // 5. Map to Rich View Model
      const profile: FamilyMemberProfileVM = {
        id: member.id.toString(),
        familyId: family.id.toString(),

        // 1. Core Identity
        identity: {
          fullName: member.props.name.getFullName(),
          officialName: member.props.name.toOfficialFormat(),
          first: member.props.name.toJSON().firstName,
          last: member.props.name.toJSON().lastName,
          gender: member.props.gender,
          dateOfBirth: member.props.dateOfBirth,
          age: member.calculateAge() || undefined,
          nationalId: member.props.nationalId?.toString(),
        },

        // 2. Life & Vital Status
        vitalStatus: {
          isAlive: member.props.isAlive,
          dateOfDeath: member.props.dateOfDeath,
          isMissing: member.props.isMissing,
        },

        // 3. Cultural & Location Context
        context: {
          tribe: member.props.tribe || family.props.clanName,
          clan: member.props.clanRole || family.props.subClan,
          homeCounty: family.props.homeCounty,
          placeOfBirth: member.props.placeOfBirth,
        },

        // 4. Verification Status (FIXED Type Safety)
        verification: {
          isVerified: member.props.verificationStatus === 'VERIFIED',
          status: this.mapVerificationStatus(member.props.verificationStatus),
          method:
            member.props.verificationStatus === 'VERIFIED' ? 'MANUAL_DOCUMENT_REVIEW' : undefined,
          confidenceScore: member.props.nationalIdVerified ? 100 : 50,
        },

        // 5. Immediate Kinship (Detailed)
        kinship: {
          parents: parents.map((p) => {
            const rel = family.props.relationships.find(
              (r) =>
                r.props.fromMemberId.equals(p.id) &&
                r.props.toMemberId.equals(member.id) &&
                r.props.relationshipType === RelationshipType.PARENT,
            );
            return {
              id: p.id.toString(),
              name: p.props.name.getFullName(),
              relationshipType: rel?.props.isBiological ? 'BIOLOGICAL' : 'ADOPTIVE',
              isAlive: p.props.isAlive,
            };
          }),

          spouses: spouses.map((s) => {
            const marriage = family.props.marriages.find(
              (m) =>
                (m.props.spouse1Id.equals(s.id) && m.props.spouse2Id.equals(member.id)) ||
                (m.props.spouse2Id.equals(s.id) && m.props.spouse1Id.equals(member.id)),
            );
            return {
              id: s.id.toString(),
              name: s.props.name.getFullName(),
              marriageType: marriage?.props.marriageType || 'UNKNOWN',
              status: marriage?.props.marriageStatus || 'UNKNOWN',
              dateOfMarriage: marriage?.props.startDate,
            };
          }),

          children: children.map((c) => ({
            id: c.id.toString(),
            name: c.props.name.getFullName(),
            gender: c.props.gender,
            age: c.calculateAge() || undefined,
            relationshipType: 'BIOLOGICAL',
          })),

          siblings: siblings.map((s) => {
            const myParents = parents.map((p) => p.id.toString());
            const theirParents = family.getParents(s.id).map((p) => p.id.toString());
            const sharedCount = myParents.filter((id) => theirParents.includes(id)).length;
            return {
              id: s.id.toString(),
              name: s.props.name.getFullName(),
              type: sharedCount === 2 ? 'FULL' : 'HALF',
            };
          }),
        },

        // 6. Section 40 Context
        polygamyContext: {
          isPolygamousFamily: family.isPolygamous(),
          belongsToHouseId: house?.id.toString(),
          belongsToHouseName: house?.props.houseName,
          isHouseHead: isHouseHead,
        },

        // 7. Legal & Succession Indicators
        legalStatus: {
          isMinor: member.isMinor(),
          isAdult: member.isAdult(),
          hasGuardian: false,
          qualifiesForS29: member.qualifiesForDependencyClaim(),
          inheritanceEligibility: member.props.isAlive ? 'FULL' : 'NONE',
        },

        // 8. Meta
        metadata: {
          dateAdded: member.createdAt,
          lastUpdated: member.updatedAt,
          addedBy: member.props.createdBy.toString(),
        },
      };

      return Result.ok(profile);
    } catch (error) {
      return this.handleError(error, query);
    }
  }

  /**
   * Helper to map Entity status to VM status strict types
   */
  private mapVerificationStatus(
    status: string, // Accepting string to allow loose matching against entity
  ): 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FLAGGED' {
    switch (status) {
      case 'VERIFICATION_PENDING':
      case 'PENDING_VERIFICATION': // Handle variations
        return 'PENDING';
      case 'REJECTED':
      case 'DISPUTED':
        return 'FLAGGED';
      case 'VERIFIED':
        return 'VERIFIED';
      case 'UNVERIFIED':
      default:
        return 'UNVERIFIED';
    }
  }
}
