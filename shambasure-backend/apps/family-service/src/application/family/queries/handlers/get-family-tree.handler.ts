// application/family/queries/handlers/get-family-tree.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { IFamilyRelationshipRepository } from '../../../../domain/interfaces/repositories/ifamily-relationship.repository';
import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { FamilyTreeBuilder } from '../../../../domain/utils/family-tree-builder';
import { Result } from '../../common/result';
import { FamilyTreeResponse } from '../../dto/response/family-tree.response';
import { FamilyMemberMapper } from '../../mappers/family-member.mapper';
import { GetFamilyTreeQuery, TreeLayout, TreeOrientation } from '../impl/get-family-tree.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(GetFamilyTreeQuery)
export class GetFamilyTreeHandler extends BaseQueryHandler<
  GetFamilyTreeQuery,
  Result<FamilyTreeResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly familyRelationshipRepository: IFamilyRelationshipRepository,
    private readonly familyMemberMapper: FamilyMemberMapper,
    private readonly familyTreeBuilder: FamilyTreeBuilder,
    queryBus: any,
  ) {
    super(queryBus);
  }

  async execute(query: GetFamilyTreeQuery): Promise<Result<FamilyTreeResponse>> {
    try {
      // Validate query
      const validation = this.validateQuery(query);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Load family
      const family = await this.familyRepository.findById(query.familyId);
      if (!family) {
        return Result.fail(`Family with ID ${query.familyId} not found`);
      }

      // Load all family members
      const members = await this.familyMemberRepository.findAllByFamilyId(query.familyId);

      // Load all relationships
      const relationships = await this.familyRelationshipRepository.findAllByFamilyId(
        query.familyId,
      );

      // Determine root member
      let rootMemberId = query.rootMemberId;
      if (!rootMemberId) {
        // Find oldest known ancestor (person with no parents in the family)
        rootMemberId = this.findRootMember(members, relationships);
      }

      if (!rootMemberId) {
        return Result.fail('Unable to determine root member for family tree');
      }

      // Build family tree
      const tree = this.familyTreeBuilder.buildTree({
        rootMemberId,
        members,
        relationships,
        maxDepth: query.maxDepth,
        includeDeceased: query.includeDeceased,
        includeAdopted: query.includeAdopted,
        includeStepRelations: query.includeStepRelations,
        includePolygamousHouses: query.includePolygamousHouses,
      });

      // Generate tree visualization layout
      const layout = this.generateTreeLayout(tree, query);

      // Build response
      const response: FamilyTreeResponse = {
        familyId: query.familyId,
        familyName: family.name,
        rootMemberId,
        maxDepth: query.maxDepth,
        totalNodes: tree.nodes.length,
        totalMarriages: tree.marriages.length,
        livingMembers: tree.nodes.filter((n) => !n.isDeceased).length,
        deceasedMembers: tree.nodes.filter((n) => n.isDeceased).length,
        nodes: tree.nodes.map((node) => this.familyMemberMapper.toTreeNodeDTO(node)),
        edges: tree.edges,
        generations: this.calculateGenerationStats(tree),
        visualizationConfig: {
          orientation: query.orientation,
          nodeWidth: query.nodeWidth,
          nodeHeight: query.nodeHeight,
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

  private findRootMember(members: any[], relationships: any[]): string | null {
    // Simple heuristic: find member with no parents in the family
    const membersWithParents = new Set<string>();

    relationships.forEach((rel) => {
      if (rel.type === 'PARENT_CHILD') {
        membersWithParents.add(rel.toMemberId);
      }
    });

    // Find members without parents
    const membersWithoutParents = members.filter((m) => !membersWithParents.has(m.id));

    if (membersWithoutParents.length === 0) {
      // If no member without parents, try to find the oldest member
      const oldestMember = members.reduce((oldest, current) => {
        const oldestAge = oldest.currentAge || 0;
        const currentAge = current.currentAge || 0;
        return currentAge > oldestAge ? current : oldest;
      }, members[0]);

      return oldestMember?.id || null;
    }

    // If multiple without parents, choose the oldest
    if (membersWithoutParents.length > 1) {
      const oldestMember = membersWithoutParents.reduce((oldest, current) => {
        const oldestAge = oldest.currentAge || 0;
        const currentAge = current.currentAge || 0;
        return currentAge > oldestAge ? current : oldest;
      }, membersWithoutParents[0]);

      return oldestMember.id;
    }

    return membersWithoutParents[0]?.id || null;
  }

  private generateTreeLayout(tree: any, query: GetFamilyTreeQuery): any {
    // This is a simplified layout algorithm
    // In production, use a proper tree layout library like d3-hierarchy

    const layout = {
      nodes: [],
      edges: [],
    };

    // Simple hierarchical layout
    let currentY = 0;
    let currentX = 0;
    const layerHeight = query.nodeHeight + 100; // 100px spacing between layers

    // Group nodes by generation
    const nodesByGeneration = new Map<number, any[]>();
    tree.nodes.forEach((node) => {
      const gen = node.generation || 0;
      if (!nodesByGeneration.has(gen)) {
        nodesByGeneration.set(gen, []);
      }
      nodesByGeneration.get(gen).push(node);
    });

    // Layout each generation
    for (let gen = 0; gen <= query.maxDepth; gen++) {
      const generationNodes = nodesByGeneration.get(gen) || [];
      currentY = gen * layerHeight;

      // Calculate total width needed for this generation
      const totalWidth = generationNodes.length * (query.nodeWidth + 50);
      currentX = -totalWidth / 2; // Center the generation

      generationNodes.forEach((node) => {
        layout.nodes.push({
          ...node,
          x: currentX,
          y: currentY,
          width: query.nodeWidth,
          height: query.nodeHeight,
        });
        currentX += query.nodeWidth + 50;
      });
    }

    return layout;
  }

  private calculateGenerationStats(tree: any): Array<{
    generation: number;
    count: number;
    averageAge: number;
    livingCount: number;
    deceasedCount: number;
  }> {
    const stats = new Map<number, any>();

    tree.nodes.forEach((node) => {
      const gen = node.generation || 0;
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
      stat.totalAge += node.currentAge || 0;

      if (node.isDeceased) {
        stat.deceasedCount++;
      } else {
        stat.livingCount++;
      }
    });

    return Array.from(stats.values()).map((stat) => ({
      generation: stat.generation,
      count: stat.count,
      averageAge: stat.count > 0 ? Math.round(stat.totalAge / stat.count) : 0,
      livingCount: stat.livingCount,
      deceasedCount: stat.deceasedCount,
    }));
  }
}
