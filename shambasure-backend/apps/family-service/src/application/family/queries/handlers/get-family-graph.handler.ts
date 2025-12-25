import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { GetFamilyGraphQuery } from '../impl/get-family-graph.query';
import { FamilyGraphVM, GraphEdge, GraphNode } from '../read-models/family-graph-node.vm';

@QueryHandler(GetFamilyGraphQuery)
export class GetFamilyGraphHandler
  extends BaseQueryHandler<GetFamilyGraphQuery, FamilyGraphVM>
  implements IQueryHandler<GetFamilyGraphQuery, Result<FamilyGraphVM>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    private readonly repository: IFamilyRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetFamilyGraphQuery): Promise<Result<FamilyGraphVM>> {
    try {
      const family = await this.repository.findById(query.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', query.familyId));
      }

      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];

      // 1. Build Nodes (Members)
      family.props.members.forEach((member) => {
        if (!member.props.isArchived || query.includeArchived) {
          nodes.push({
            id: member.id.toString(),
            type: 'MEMBER',
            data: {
              fullName: member.props.name.getFullName(),
              gender: member.props.gender,
              dateOfBirth: member.props.dateOfBirth?.toISOString(),
              isAlive: member.props.isAlive,
              isHeadOfFamily: member.props.isHeadOfFamily,
              isVerified: member.props.verificationStatus === 'VERIFIED',
              hasMissingData: !member.props.nationalId, // UI Trigger
              photoUrl: member.props.profilePictureUrl,
            },
          });
        }
      });

      // 2. Build Edges (Relationships)
      family.props.relationships.forEach((rel) => {
        if (!rel.props.isArchived) {
          edges.push({
            id: rel.id.toString(),
            source: rel.props.fromMemberId.toString(),
            target: rel.props.toMemberId.toString(),
            type: 'PARENT_CHILD', // Simplified mapping
            data: {
              isBiological: rel.props.isBiological,
              isLegal: rel.props.isLegal,
              isVerified: rel.props.verificationLevel !== 'UNVERIFIED',
              label: rel.props.relationshipType,
            },
            style: {
              stroke: rel.props.isBiological ? '#2ecc71' : '#3498db', // Green for bio, Blue for legal
              strokeWidth: 2,
            },
          });
        }
      });

      // 3. Build Edges (Marriages)
      family.props.marriages.forEach((marriage) => {
        if (!marriage.props.isArchived) {
          edges.push({
            id: marriage.id.toString(),
            source: marriage.props.spouse1Id.toString(),
            target: marriage.props.spouse2Id.toString(),
            type: 'SPOUSE',
            data: {
              isBiological: false,
              isLegal: marriage.isLegallyRecognized(),
              isVerified: marriage.props.verificationStatus === 'VERIFIED',
              label: marriage.props.marriageType,
            },
            style: {
              stroke: '#e74c3c', // Red for marriage
              strokeWidth: 3,
            },
          });
        }
      });

      return Result.ok({
        familyId: family.id.toString(),
        nodes,
        edges,
      });
    } catch (error) {
      return this.handleError(error, query);
    }
  }
}
