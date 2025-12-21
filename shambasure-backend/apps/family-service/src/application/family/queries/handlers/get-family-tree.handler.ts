import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';
import { RelationshipType } from '@prisma/client';

import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import { FamilyRelationship } from '../../../../domain/entities/family-relationship.entity';
import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import type { IFamilyRelationshipRepository } from '../../../../domain/interfaces/repositories/ifamily-relationship.repository';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import type { IPolygamousHouseRepository } from '../../../../domain/interfaces/repositories/ipolygamous-house.repository';
import { FamilyTreeBuilder, FamilyTreeNode } from '../../../../domain/utils/family-tree-builder';
import { Result } from '../../../common/base/result';
import {
  FamilyTreeNodeResponse,
  FamilyTreeResponse,
} from '../../dto/response/family-tree.response';
import { FamilyMemberMapper } from '../../mappers/family-member.mapper';
import { GetFamilyTreeQuery, TreeOrientation } from '../impl/get-family-tree.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(GetFamilyTreeQuery)
export class GetFamilyTreeHandler extends BaseQueryHandler<GetFamilyTreeQuery, FamilyTreeResponse> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly familyRelationshipRepository: IFamilyRelationshipRepository,
    private readonly polygamousHouseRepository: IPolygamousHouseRepository,
    private readonly familyMemberMapper: FamilyMemberMapper,
    private readonly familyTreeBuilder: FamilyTreeBuilder,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetFamilyTreeQuery): Promise<Result<FamilyTreeResponse>> {
    try {
      const validation = this.validateQuery(query);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 1. Load Family Context
      const family = await this.familyRepository.findById(query.familyId);
      if (!family) {
        return Result.fail(new Error(`Family with ID ${query.familyId} not found`));
      }

      // 2. Load Graph Data
      const members = await this.familyMemberRepository.findAllByFamilyId(query.familyId);
      const relationships = await this.familyRelationshipRepository.findAllByFamilyId(
        query.familyId,
      );

      // Load Houses for S.40 Context (Critical for correct grouping)
      const houses = query.includePolygamousHouses
        ? await this.polygamousHouseRepository.findAllByFamilyId(query.familyId)
        : [];

      // 3. Determine Root
      let rootMemberId: string | null = query.rootMemberId ?? null;
      if (!rootMemberId) {
        rootMemberId = this.findRootMember(members, relationships);
      }

      if (!rootMemberId) {
        // Fallback: If absolutely no root found (e.g. empty family), return empty tree
        if (members.length === 0) return Result.ok(this.createEmptyResponse(query, family.name));
        return Result.fail(new Error('Unable to determine root member for family tree structure'));
      }

      // 4. Build Tree Structure (Using Domain Service)
      const builtTree = this.familyTreeBuilder.buildTree({
        rootMemberId,
        members,
        relationships,
        houses,
        maxDepth: query.maxDepth,
        includeDeceased: query.includeDeceased,
        includeAdopted: query.includeAdopted,
        includeStepRelations: query.includeStepRelations,
        includePolygamousHouses: query.includePolygamousHouses,
      });

      // 5. Calculate Layout (Presentation Logic)
      const layoutNodes = this.generateTreeLayout(builtTree.nodes, query);

      // 6. Map to DTO
      const response: FamilyTreeResponse = {
        familyId: query.familyId,
        familyName: family.name,
        rootMemberId,
        maxDepth: query.maxDepth || 4,
        totalNodes: layoutNodes.length,
        totalMarriages: builtTree.marriages.length,
        livingMembers: layoutNodes.filter((n) => !n.isDeceased).length,
        deceasedMembers: layoutNodes.filter((n) => n.isDeceased).length,

        nodes: layoutNodes,

        edges: builtTree.edges.map((e) => ({
          source: e.source,
          target: e.target,
          type: e.type,
          label: e.label,
          isBiological: e.type !== 'ADOPTION' && e.type !== 'MARRIAGE',
        })),

        generations: this.calculateGenerationStats(layoutNodes),

        visualizationConfig: {
          orientation: query.orientation || TreeOrientation.HORIZONTAL,
          nodeWidth: query.nodeWidth || 200,
          nodeHeight: query.nodeHeight || 60,
          nodeSpacing: 50,
          layerSpacing: 100,
        },
        generatedAt: new Date(),
        version: '1.0',
      };

      this.logSuccess(query, response, 'Family tree generated');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'GetFamilyTreeHandler');
    }
  }

  // --- Helpers ---

  private findRootMember(
    members: FamilyMember[],
    relationships: FamilyRelationship[],
  ): string | null {
    if (members.length === 0) return null;

    // 1. Identify members who are targets of 'PARENT_CHILD' (i.e., they are children)
    const childIds = new Set<string>();
    relationships.forEach((rel) => {
      if (rel.type === RelationshipType.PARENT) {
        // relationship stored as: From Parent -> To Child
        // Note: Check your Relationship direction in repository.
        // Usually: From=Parent, To=Child.
        // If generic: Parent(From) -> Child(To)
        childIds.add(rel.toMemberId);
      }
    });

    // 2. Find members who are NOT in the child set (Potential Roots)
    const potentialRoots = members.filter((m) => !childIds.has(m.id));

    if (potentialRoots.length === 0) {
      // Cyclic graph or data issue? Fallback to oldest member.
      return this.findOldestMember(members);
    }

    if (potentialRoots.length === 1) {
      return potentialRoots[0].id;
    }

    // 3. Tie-breaker: Oldest among potential roots
    return this.findOldestMember(potentialRoots);
  }

  private findOldestMember(members: FamilyMember[]): string | null {
    if (members.length === 0) return null;

    // Sort descending by age (if available) or birth date
    // Note: currentAge might be null, fallback to 0 implies young/unknown
    const sorted = [...members].sort((a, b) => {
      const ageA = a.currentAge || 0;
      const ageB = b.currentAge || 0;
      return ageB - ageA;
    });

    return sorted[0].id;
  }

  private generateTreeLayout(
    domainNodes: FamilyTreeNode[],
    query: GetFamilyTreeQuery,
  ): FamilyTreeNodeResponse[] {
    const nodeWidth = query.nodeWidth || 200;
    const nodeHeight = query.nodeHeight || 60;
    const nodeSpacing = 50;
    const layerSpacing = 100;

    const dtos: FamilyTreeNodeResponse[] = [];

    // Group by generation
    const levels = new Map<number, FamilyTreeNode[]>();
    domainNodes.forEach((node) => {
      const gen = node.generation;
      if (!levels.has(gen)) levels.set(gen, []);
      levels.get(gen)!.push(node);
    });

    // Assign Coordinates
    levels.forEach((nodesInLevel, generation) => {
      const layerY = generation * (nodeHeight + layerSpacing);
      const totalWidth = nodesInLevel.length * (nodeWidth + nodeSpacing) - nodeSpacing;
      let startX = -(totalWidth / 2);

      nodesInLevel.forEach((node) => {
        // Map Domain Node -> DTO
        if (node.member) {
          const dto = this.familyMemberMapper.toTreeNodeDTO(node.member);

          // Enrich DTO with Layout Data
          dto.x = startX;
          dto.y = layerY;
          dto.generation = generation;
          dto.depth = node.depth;
          dto.width = nodeWidth;
          dto.height = nodeHeight;

          // Add Relationship IDs for frontend linking
          dto.children = node.children.map((c) => ({ id: c.memberId }) as any);
          dto.parents = node.parents.map((p) => ({ id: p.memberId }) as any);
          dto.spouses = node.spouses.map((s) => ({ id: s.memberId }) as any);

          dtos.push(dto);
        }
        startX += nodeWidth + nodeSpacing;
      });
    });

    return dtos;
  }

  private calculateGenerationStats(nodes: FamilyTreeNodeResponse[]): any[] {
    const stats = new Map<number, any>();

    nodes.forEach((node) => {
      const gen = node.generation;
      if (!stats.has(gen)) {
        stats.set(gen, {
          generation: gen,
          count: 0,
          totalAge: 0,
          livingCount: 0,
          deceasedCount: 0,
        });
      }

      const stat = stats.get(gen);
      stat.count++;
      stat.totalAge += node.age || 0;

      if (node.isDeceased) {
        stat.deceasedCount++;
      } else {
        stat.livingCount++;
      }
    });

    return Array.from(stats.values())
      .sort((a, b) => a.generation - b.generation)
      .map((stat) => ({
        generation: stat.generation,
        count: stat.count,
        averageAge: stat.count > 0 ? Math.round(stat.totalAge / stat.count) : 0,
        livingCount: stat.livingCount,
        deceasedCount: stat.deceasedCount,
      }));
  }

  private createEmptyResponse(query: GetFamilyTreeQuery, familyName: string): FamilyTreeResponse {
    return {
      familyId: query.familyId,
      familyName,
      rootMemberId: '',
      maxDepth: 0,
      totalNodes: 0,
      totalMarriages: 0,
      livingMembers: 0,
      deceasedMembers: 0,
      nodes: [],
      edges: [],
      generations: [],
      visualizationConfig: {
        orientation: query.orientation || TreeOrientation.HORIZONTAL,
        nodeWidth: 200,
        nodeHeight: 60,
        nodeSpacing: 50,
        layerSpacing: 100,
      },
      generatedAt: new Date(),
      version: '1.0',
    };
  }
}
