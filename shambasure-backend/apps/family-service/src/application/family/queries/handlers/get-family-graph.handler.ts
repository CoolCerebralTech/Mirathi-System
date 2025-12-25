import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { RelationshipType } from '../../../../domain/value-objects/family-enums.vo';
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

      // 0. Pre-calculation: S.40 House Mapping (for Coloring)
      // This allows us to visually group members by House (e.g., House 1 = Blue)
      const houseColors = ['#3498db', '#e67e22', '#9b59b6', '#2ecc71', '#f1c40f']; // Palette
      const memberHouseMap = new Map<string, { id: string; color: string }>();

      family.props.houses.forEach((house, index) => {
        const color = houseColors[index % houseColors.length];

        // Map Wife
        memberHouseMap.set(house.props.originalWifeId.toString(), {
          id: house.id.toString(),
          color,
        });

        // Map Children (If they are linked via IDs in the house entity)
        // In a full implementation, we might check relationships, but for now we use the house props
        house.props.childrenIds.forEach((childId) => {
          memberHouseMap.set(childId.toString(), { id: house.id.toString(), color });
        });
      });

      // 1. Build Nodes (Members)
      family.props.members.forEach((member) => {
        if (!member.props.isArchived || query.includeArchived) {
          const houseInfo = memberHouseMap.get(member.id.toString());

          nodes.push({
            id: member.id.toString(),
            type: 'MEMBER',
            data: {
              fullName: member.props.name.getFullName(),
              gender: member.props.gender,
              dateOfBirth: member.props.dateOfBirth?.toISOString(),
              isAlive: member.props.isAlive,
              isHeadOfFamily: member.props.isHeadOfFamily,
              isVerified: member.props.nationalIdVerified,
              hasMissingData: !member.props.nationalId || !member.props.dateOfBirth,
              photoUrl: member.props.profilePictureUrl,

              // S.40 Visuals
              houseId: houseInfo?.id,
              houseColor: houseInfo?.color,
            },
          });
        }
      });

      // 2. Build Edges (Relationships)
      family.props.relationships.forEach((rel) => {
        if (!rel.props.isArchived) {
          // Determine Graph Direction: Source -> Target
          // Usually we want Parent -> Child for hierarchy
          let source = rel.props.fromMemberId.toString();
          let target = rel.props.toMemberId.toString();
          let type: GraphEdge['type'] = 'PARENT_CHILD';

          if (rel.props.relationshipType === RelationshipType.CHILD) {
            // Edge says "From Member is CHILD of To Member"
            // Visual Graph prefers "Parent -> Child"
            source = rel.props.toMemberId.toString();
            target = rel.props.fromMemberId.toString();
          } else if (rel.props.relationshipType === RelationshipType.SIBLING) {
            type = 'SIBLING';
          }

          edges.push({
            id: rel.id.toString(),
            source,
            target,
            type: type,
            data: {
              isBiological: rel.props.isBiological,
              isLegal: rel.props.isLegal,
              isVerified: rel.props.verificationLevel !== 'UNVERIFIED',
              label: rel.props.relationshipType,
            },
            style: {
              // Digital Lawyer Visuals: Dotted lines for unverified data
              stroke: rel.props.isBiological ? '#27ae60' : '#2980b9', // Green (Bio) vs Blue (Legal)
              strokeWidth: rel.props.relationshipType === RelationshipType.PARENT ? 2 : 1,
              strokeDasharray: rel.props.verificationLevel === 'UNVERIFIED' ? '5,5' : undefined,
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
              stroke: '#c0392b', // Red for marriage
              strokeWidth: 2,
            },
          });
        }
      });

      // 4. Build Edges (Cohabitations) - S.29 Support
      family.props.cohabitations.forEach((cohab) => {
        if (cohab.props.isActive) {
          edges.push({
            id: cohab.id.toString(),
            source: cohab.props.partner1Id.toString(),
            target: cohab.props.partner2Id.toString(),
            type: 'COHABITATION',
            data: {
              isBiological: false,
              isLegal: false,
              isVerified: false,
              label: 'Come-we-stay',
            },
            style: {
              stroke: '#8e44ad', // Purple
              strokeWidth: 2,
              strokeDasharray: '4,4', // Always dashed/dotted as it's not full marriage
            },
          });
        }
      });

      // 5. Calculate Stats
      const stats = {
        nodesCount: nodes.length,
        edgesCount: edges.length,
        generations: 3, // Placeholder for MVP
      };

      return Result.ok({
        familyId: family.id.toString(),
        stats,
        nodes,
        edges,
      });
    } catch (error) {
      return this.handleError(error, query);
    }
  }
}
