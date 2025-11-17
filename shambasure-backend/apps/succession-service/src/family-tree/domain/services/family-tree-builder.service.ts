// family-tree/domain/services/family-tree-builder.service.ts
import { Injectable } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';
import {
  FamilyTree,
  FamilyTreeNode,
  FamilyTreeRelationship,
} from '../value-objects/family-tree.vo';
import { FamilyMember } from '../entities/family-member.entity';
import { Marriage } from '../entities/marriage.entity';
import { KenyanRelationship } from '../value-objects/kenyan-relationship.vo';

export interface TreeBuildResult {
  tree: FamilyTree;
  statistics: {
    totalNodes: number;
    relationships: number;
    generations: number;
    completeness: number; // 0-100%
  };
  issues: string[];
  recommendations: string[];
}

@Injectable()
export class FamilyTreeBuilderService {
  /**
   * Builds a comprehensive family tree from family data
   */
  buildFamilyTree(
    rootMember: FamilyMember,
    allMembers: FamilyMember[],
    marriages: Marriage[],
  ): TreeBuildResult {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Create tree with root member
    const rootNode = this.createTreeNode(rootMember);
    const tree = FamilyTree.createFromRoot(rootNode);

    const memberMap = new Map<string, FamilyMember>();
    allMembers.forEach((member) => memberMap.set(member.getId(), member));

    // Add all members to the tree
    for (const member of allMembers) {
      if (member.getId() !== rootMember.getId()) {
        const node = this.createTreeNode(member);
        tree.addNode(node);
      }
    }

    // Build relationships from marriages
    this.buildMarriageRelationships(tree, marriages, issues);

    // Build parent-child relationships (inferred from marriages and member relationships)
    this.buildParentChildRelationships(tree, allMembers, marriages, issues);

    // Build other relationships
    this.buildOtherRelationships(tree, allMembers, issues);

    // Validate tree integrity
    const validation = tree.validateTreeIntegrity();
    if (!validation.isValid) {
      issues.push(...validation.issues);
    }

    // Calculate statistics
    const statistics = this.calculateTreeStatistics(tree, allMembers.length);

    // Generate recommendations
    this.generateTreeRecommendations(tree, statistics, recommendations);

    return {
      tree,
      statistics,
      issues,
      recommendations,
    };
  }

  /**
   * Builds marriage relationships in the family tree
   */
  private buildMarriageRelationships(
    tree: FamilyTree,
    marriages: Marriage[],
    issues: string[],
  ): void {
    for (const marriage of marriages) {
      if (!marriage.getIsActive()) {
        continue; // Skip dissolved marriages for current tree
      }

      try {
        tree.addRelationship(
          marriage.getSpouse1Id(),
          marriage.getSpouse2Id(),
          RelationshipType.SPOUSE,
          RelationshipType.SPOUSE,
          marriage.getMarriageDetails().getMarriageDate(),
        );
      } catch (error) {
        issues.push(`Failed to add marriage relationship: ${error.message}`);
      }
    }
  }

  /**
   * Builds parent-child relationships in the family tree
   */
  private buildParentChildRelationships(
    tree: FamilyTree,
    allMembers: FamilyMember[],
    marriages: Marriage[],
    issues: string[],
  ): void {
    // This is a simplified implementation
    // In reality, we'd have more sophisticated logic to determine parent-child relationships

    const memberMap = new Map<string, FamilyMember>();
    allMembers.forEach((member) => memberMap.set(member.getId(), member));

    // For each marriage, try to identify children
    for (const marriage of marriages) {
      const spouse1Id = marriage.getSpouse1Id();
      const spouse2Id = marriage.getSpouse2Id();

      // Look for members who might be children of this marriage
      const potentialChildren = allMembers.filter((member) => {
        const relationshipType = member.getRelationshipType().getRelationshipType();
        return (
          relationshipType === RelationshipType.CHILD ||
          relationshipType === RelationshipType.ADOPTED_CHILD ||
          relationshipType === RelationshipType.STEPCHILD
        );
      });

      for (const child of potentialChildren) {
        try {
          // Add parent-child relationships
          tree.addRelationship(
            spouse1Id,
            child.getId(),
            RelationshipType.PARENT,
            RelationshipType.CHILD,
          );

          tree.addRelationship(
            spouse2Id,
            child.getId(),
            RelationshipType.PARENT,
            RelationshipType.CHILD,
          );
        } catch (error) {
          issues.push(`Failed to add parent-child relationship: ${error.message}`);
        }
      }
    }
  }

  /**
   * Builds other relationships (siblings, grandparents, etc.)
   */
  private buildOtherRelationships(
    tree: FamilyTree,
    allMembers: FamilyMember[],
    issues: string[],
  ): void {
    // Build sibling relationships
    this.buildSiblingRelationships(tree, allMembers, issues);

    // Build grandparent relationships
    this.buildGrandparentRelationships(tree, allMembers, issues);

    // Build other explicit relationships from member data
    this.buildExplicitRelationships(tree, allMembers, issues);
  }

  /**
   * Builds sibling relationships by finding common parents
   */
  private buildSiblingRelationships(
    tree: FamilyTree,
    allMembers: FamilyMember[],
    issues: string[],
  ): void {
    // Group members by their parents
    const childrenByParents = new Map<string, string[]>();

    for (const member of allMembers) {
      const relationships = tree.getRelationships(member.getId());
      const parents = relationships.filter(
        (rel) => rel.relationshipType === RelationshipType.PARENT,
      );

      for (const parent of parents) {
        const key = parent.targetPersonId;
        if (!childrenByParents.has(key)) {
          childrenByParents.set(key, []);
        }
        childrenByParents.get(key)!.push(member.getId());
      }
    }

    // Create sibling relationships for children with common parents
    for (const [parentId, children] of childrenByParents.entries()) {
      if (children.length > 1) {
        for (let i = 0; i < children.length; i++) {
          for (let j = i + 1; j < children.length; j++) {
            try {
              tree.addRelationship(
                children[i],
                children[j],
                RelationshipType.SIBLING,
                RelationshipType.SIBLING,
              );
            } catch (error) {
              issues.push(`Failed to add sibling relationship: ${error.message}`);
            }
          }
        }
      }
    }
  }

  /**
   * Builds grandparent relationships
   */
  private buildGrandparentRelationships(
    tree: FamilyTree,
    allMembers: FamilyMember[],
    issues: string[],
  ): void {
    for (const member of allMembers) {
      const relationships = tree.getRelationships(member.getId());
      const parents = relationships.filter(
        (rel) => rel.relationshipType === RelationshipType.PARENT,
      );

      for (const parent of parents) {
        const parentRelationships = tree.getRelationships(parent.targetPersonId);
        const grandparents = parentRelationships.filter(
          (rel) => rel.relationshipType === RelationshipType.PARENT,
        );

        for (const grandparent of grandparents) {
          try {
            tree.addRelationship(
              grandparent.targetPersonId,
              member.getId(),
              RelationshipType.GRANDPARENT,
              RelationshipType.GRANDCHILD,
            );
          } catch (error) {
            issues.push(`Failed to add grandparent relationship: ${error.message}`);
          }
        }
      }
    }
  }

  /**
   * Builds relationships explicitly defined in member data
   */
  private buildExplicitRelationships(
    tree: FamilyTree,
    allMembers: FamilyMember[],
    issues: string[],
  ): void {
    for (const member of allMembers) {
      const relationshipType = member.getRelationshipType();
      const relationshipTo = member.getRelationshipTo();

      if (relationshipTo) {
        // Try to parse the relationship description to find target person
        // This is simplified - in reality, we'd have more structured data
        const targetMatch = relationshipTo.match(
          /(?:son|daughter|father|mother|brother|sister)\s+of\s+(\w+\s+\w+)/i,
        );

        if (targetMatch) {
          const targetName = targetMatch[1];
          // Find member with matching name (simplified)
          const targetMember = allMembers.find(
            (m) =>
              `${m.getPersonalDetails().firstName} ${m.getPersonalDetails().lastName}` ===
              targetName,
          );

          if (targetMember) {
            try {
              const reciprocalType = this.getReciprocalType(relationshipType.getRelationshipType());
              tree.addRelationship(
                member.getId(),
                targetMember.getId(),
                relationshipType.getRelationshipType(),
                reciprocalType,
              );
            } catch (error) {
              issues.push(`Failed to add explicit relationship: ${error.message}`);
            }
          }
        }
      }
    }
  }

  /**
   * Creates a tree node from a family member
   */
  private createTreeNode(member: FamilyMember): FamilyTreeNode {
    return {
      id: member.getId(),
      personId: member.getId(),
      firstName: member.getPersonalDetails().firstName,
      lastName: member.getPersonalDetails().lastName,
      dateOfBirth: member.getPersonalDetails().dateOfBirth,
      dateOfDeath: member.getPersonalDetails().dateOfDeath,
      isDeceased: member.getIsDeceased(),
      isMinor: member.getIsMinor(),
      relationships: [],
    };
  }

  /**
   * Gets reciprocal relationship type
   */
  private getReciprocalType(relationshipType: RelationshipType): RelationshipType {
    const reciprocalMap: Record<RelationshipType, RelationshipType> = {
      [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
      [RelationshipType.PARENT]: RelationshipType.CHILD,
      [RelationshipType.CHILD]: RelationshipType.PARENT,
      [RelationshipType.SIBLING]: RelationshipType.SIBLING,
      [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
      [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
      [RelationshipType.ADOPTED_CHILD]: RelationshipType.PARENT,
      [RelationshipType.STEPCHILD]: RelationshipType.PARENT,
      [RelationshipType.NIECE_NEPHEW]: RelationshipType.AUNT_UNCLE,
      [RelationshipType.AUNT_UNCLE]: RelationshipType.NIECE_NEPHEW,
      [RelationshipType.COUSIN]: RelationshipType.COUSIN,
      [RelationshipType.GUARDIAN]: RelationshipType.OTHER,
      [RelationshipType.OTHER]: RelationshipType.OTHER,
      [RelationshipType.EX_SPOUSE]: RelationshipType.EX_SPOUSE,
    };

    return reciprocalMap[relationshipType] || RelationshipType.OTHER;
  }

  /**
   * Calculates tree statistics
   */
  private calculateTreeStatistics(
    tree: FamilyTree,
    totalMembers: number,
  ): TreeBuildResult['statistics'] {
    const nodes = tree.getAllNodes();
    let totalRelationships = 0;

    for (const node of nodes) {
      totalRelationships += node.relationships.length;
    }

    // Calculate generations (simplified)
    const generations = this.calculateGenerationCount(tree);

    // Calculate completeness (simplified)
    const expectedRelationships = nodes.length * 2; // Rough estimate
    const completeness = Math.min(100, (totalRelationships / expectedRelationships) * 100);

    return {
      totalNodes: nodes.length,
      relationships: totalRelationships,
      generations,
      completeness,
    };
  }

  /**
   * Calculates the number of generations in the tree
   */
  private calculateGenerationCount(tree: FamilyTree): number {
    const rootNode = tree.getRootNode();
    if (!rootNode) return 0;

    const maxGeneration = 0;

    const calculateDepth = (personId: string, depth: number, visited: Set<string>): number => {
      if (visited.has(personId)) return depth;
      visited.add(personId);

      let maxDepth = depth;
      const relationships = tree.getRelationships(personId);

      const children = relationships.filter(
        (rel) => rel.relationshipType === RelationshipType.CHILD,
      );

      for (const child of children) {
        const childDepth = calculateDepth(child.targetPersonId, depth + 1, visited);
        maxDepth = Math.max(maxDepth, childDepth);
      }

      return maxDepth;
    };

    return calculateDepth(rootNode.id, 1, new Set<string>());
  }

  /**
   * Generates recommendations for improving the family tree
   */
  private generateTreeRecommendations(
    tree: FamilyTree,
    statistics: TreeBuildResult['statistics'],
    recommendations: string[],
  ): void {
    if (statistics.completeness < 50) {
      recommendations.push(
        'Family tree is incomplete. Consider adding more relationship information.',
      );
    }

    if (statistics.generations < 3) {
      recommendations.push(
        'Consider adding ancestral information to extend family tree generations.',
      );
    }

    if (statistics.relationships / statistics.totalNodes < 1.5) {
      recommendations.push(
        'Many family members have limited relationship data. Enhance connections between members.',
      );
    }

    // Check for isolated nodes
    const nodes = tree.getAllNodes();
    const isolatedNodes = nodes.filter((node) => node.relationships.length === 0);

    if (isolatedNodes.length > 0) {
      recommendations.push(
        `${isolatedNodes.length} family members are isolated. Connect them to the main family tree.`,
      );
    }
  }

  /**
   * Kenyan-specific family tree validation
   */
  validateKenyanFamilyTree(tree: FamilyTree): {
    isValid: boolean;
    culturalIssues: string[];
    legalIssues: string[];
  } {
    const culturalIssues: string[] = [];
    const legalIssues: string[] = [];

    const nodes = tree.getAllNodes();

    // Check for proper identification of elders
    const elders = nodes.filter((node) => {
      if (!node.dateOfBirth || node.isDeceased) return false;
      const age = this.calculateAge(node.dateOfBirth);
      return age >= 60;
    });

    if (elders.length === 0) {
      culturalIssues.push(
        'No family elders identified. Elders play important roles in Kenyan family structures.',
      );
    }

    // Check for proper parent-child relationships
    const childrenWithoutParents = nodes.filter((node) => {
      const relationships = tree.getRelationships(node.id);
      const parents = relationships.filter(
        (rel) => rel.relationshipType === RelationshipType.PARENT,
      );
      return parents.length === 0 && !node.isDeceased;
    });

    if (childrenWithoutParents.length > 0) {
      legalIssues.push(
        `${childrenWithoutParents.length} children without parent relationships identified.`,
      );
    }

    // Check for marriage relationships
    const adults = nodes.filter((node) => {
      if (!node.dateOfBirth || node.isDeceased) return false;
      const age = this.calculateAge(node.dateOfBirth);
      return age >= 18;
    });

    const marriedAdults = adults.filter((adult) => {
      const relationships = tree.getRelationships(adult.id);
      return relationships.some((rel) => rel.relationshipType === RelationshipType.SPOUSE);
    });

    if (marriedAdults.length < adults.length * 0.3) {
      // Less than 30% of adults married
      culturalIssues.push(
        'Low marriage rate in family tree. Marriage is significant in Kenyan family structures.',
      );
    }

    return {
      isValid: culturalIssues.length === 0 && legalIssues.length === 0,
      culturalIssues,
      legalIssues,
    };
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
