import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
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
      // We need the full graph to resolve relationships
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

      // 3. Resolve Kinship Links using Aggregate Helpers
      const parents = family.getParents(memberId);
      const children = family.getChildren(memberId);
      const siblings = family.getSiblings(memberId);
      const spouses = family.getSpouses(memberId);

      // 4. Map to Profile View Model
      const profile: FamilyMemberProfileVM = {
        id: member.id.toString(),

        // Core Info
        fullName: member.props.name.getFullName(),
        officialName: member.props.name.toOfficialFormat(),
        gender: member.props.gender,
        dateOfBirth: member.props.dateOfBirth,
        age: member.calculateAge() || undefined,

        // Life Status
        isAlive: member.props.isAlive,
        deathDate: member.props.dateOfDeath,

        // Cultural
        tribe: member.props.tribe,
        clan: member.props.clanRole || family.props.clanName, // Fallback to family clan

        // Verification
        nationalId: member.props.nationalId?.toString(),
        isVerified: member.props.verificationStatus === 'VERIFIED',
        verificationMethod: member.props.verificationStatus,

        // Immediate Kinship Lists (Mapped for display)
        parents: parents.map((p) => ({
          id: p.id.toString(),
          name: p.props.name.getFullName(),
        })),

        children: children.map((c) => ({
          id: c.id.toString(),
          name: c.props.name.getFullName(),
        })),

        siblings: siblings.map((s) => ({
          id: s.id.toString(),
          name: s.props.name.getFullName(),
        })),

        spouses: spouses.map((s) => {
          // Find the specific marriage to get status
          // (Simple logic: assuming active if in getSpouses list, but can be refined)
          return {
            id: s.id.toString(),
            name: s.props.name.getFullName(),
            status: 'MARRIED',
          };
        }),

        // Legal Tags
        legalStatus: {
          isMinor: member.isMinor(),
          hasGuardian: false, // Would require checking Guardianship Aggregate (Integration point)
          qualifiesForS29: member.qualifiesForDependencyClaim(),
        },
      };

      return Result.ok(profile);
    } catch (error) {
      return this.handleError(error, query);
    }
  }
}
