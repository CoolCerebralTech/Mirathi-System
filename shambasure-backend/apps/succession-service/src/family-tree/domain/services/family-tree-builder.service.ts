import { Inject, Injectable } from '@nestjs/common';
import { MarriageStatus, RelationshipType } from '@prisma/client';

import { FamilyMember } from '../entities/family-member.entity';
import { Guardianship } from '../entities/guardianship.entity';
import { Marriage } from '../entities/marriage.entity';
import { Relationship } from '../entities/relationship.entity';
import type { FamilyMemberRepositoryInterface } from '../interfaces/family-member.repository.interface';
import type { FamilyRepositoryInterface } from '../interfaces/family.repository.interface';
import type { GuardianshipRepositoryInterface } from '../interfaces/guardianship.repository.interface';
import type { MarriageRepositoryInterface } from '../interfaces/marriage.repository.interface';
import type { RelationshipRepositoryInterface } from '../interfaces/relationship.repository.interface';

export interface TreeNode {
  id: string;
  data: {
    label: string;
    fullName: string;
    role: string;
    relationshipType?: string;
    isDeceased: boolean;
    isMinor: boolean;
    // Kenyan-Specific Data
    isFamilyHead: boolean; // Derived from Family Aggregate metadata or notes
    isElder: boolean; // Derived from age
    gender: string;
    dateOfBirth?: string;
    dateOfDeath?: string;
    age?: number;
    disabilityStatus?: string;
    dependencyLevel: string;
    clan?: string;
    nodeType: 'PERSON' | 'SPOUSE_GROUP';
    inheritanceStrength?: 'STRONG' | 'MEDIUM' | 'WEAK' | 'NONE';
    isVerified: boolean;
    style?: any;
  };
  position?: { x: number; y: number };
  style?: any;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'SOLID' | 'DASHED' | 'DOTTED';
  edgeType: 'BLOOD' | 'MARRIAGE' | 'GUARDIANSHIP' | 'ADOPTION' | 'CUSTOMARY';
  metadata?: {
    marriageType?: string;
    isActive?: boolean;
    isVerified?: boolean;
    isAdopted?: boolean;
    isBiological?: boolean;
    bornOutOfWedlock?: boolean;
  };
  style?: any;
}

export interface TreeGraph {
  nodes: TreeNode[];
  edges: TreeEdge[];
  metadata: {
    familyId: string;
    familyName: string;
    totalMembers: number;
    livingMembers: number;
    deceasedMembers: number;
    minorCount: number;
    generationCount: number;
    customaryMarriages: number;
    polygamousMarriages: number;
    lastCalculated: string;
    hasComplexStructure: boolean;
  };
}

export interface TreeLayoutOptions {
  layoutType: 'HIERARCHICAL' | 'RADIAL' | 'CUSTOM';
  showDeceased: boolean;
  showMinors: boolean;
  showExtendedFamily: boolean;
  focusMemberId?: string;
  includeMarriages: boolean;
  includeGuardianships: boolean;
}

@Injectable()
export class FamilyTreeBuilderService {
  constructor(
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepo: FamilyMemberRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepo: RelationshipRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepo: MarriageRepositoryInterface,
    @Inject('GuardianshipRepositoryInterface')
    private readonly guardianshipRepo: GuardianshipRepositoryInterface,
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepo: FamilyRepositoryInterface,
  ) {}

  /**
   * Builds the complete JSON graph for the UI with Kenyan family structure support
   */
  async buildFullTree(
    familyId: string,
    options: TreeLayoutOptions = {
      layoutType: 'HIERARCHICAL',
      showDeceased: true,
      showMinors: true,
      showExtendedFamily: true,
      includeMarriages: true,
      includeGuardianships: true,
    },
  ): Promise<TreeGraph> {
    const [members, relationships, marriages, guardianships, family] = await Promise.all([
      this.memberRepo.findByFamilyId(familyId),
      this.relationshipRepo.findByFamilyId(familyId),
      this.marriageRepo.findByFamilyId(familyId),
      this.guardianshipRepo.findActiveByFamilyId(familyId),
      this.familyRepo.findById(familyId),
    ]);

    if (!family) {
      throw new Error(`Family with ID ${familyId} not found`);
    }

    const graph: TreeGraph = {
      nodes: [],
      edges: [],
      metadata: this.buildTreeMetadata(familyId, family.getName(), members, marriages),
    };

    graph.nodes = this.buildTreeNodes(members, options);
    graph.edges = this.buildTreeEdges(relationships, marriages, guardianships, options);

    if (options.layoutType === 'HIERARCHICAL') {
      this.applyHierarchicalLayout(graph, options.focusMemberId);
    }

    return graph;
  }

  /**
   * Builds a simplified tree for immediate family
   */
  async buildImmediateFamily(memberId: string): Promise<TreeGraph> {
    const member = await this.memberRepo.findById(memberId);
    if (!member) {
      throw new Error(`Member with ID ${memberId} not found`);
    }

    const familyId = member.getFamilyId();

    const [outgoingRels, incomingRels, marriages, family] = await Promise.all([
      this.relationshipRepo.findByFromMemberId(memberId),
      this.relationshipRepo.findByToMemberId(memberId),
      this.marriageRepo.findByMemberId(memberId),
      this.familyRepo.findById(familyId),
    ]);

    const relevantMemberIds = new Set<string>();
    relevantMemberIds.add(memberId);

    marriages.forEach((marriage) => {
      relevantMemberIds.add(marriage.getSpouse1Id());
      relevantMemberIds.add(marriage.getSpouse2Id());
    });

    outgoingRels.forEach((rel) => relevantMemberIds.add(rel.getToMemberId()));
    incomingRels.forEach((rel) => relevantMemberIds.add(rel.getFromMemberId()));

    const members = await Promise.all(
      Array.from(relevantMemberIds).map((id) => this.memberRepo.findById(id)),
    );
    const validMembers = members.filter((m): m is FamilyMember => m !== null);

    const graph: TreeGraph = {
      nodes: this.buildTreeNodes(validMembers, {
        layoutType: 'HIERARCHICAL',
        showDeceased: true,
        showMinors: true,
        showExtendedFamily: false,
        includeMarriages: true,
        includeGuardianships: false,
      }),
      edges: this.buildTreeEdges([...outgoingRels, ...incomingRels], marriages, [], {
        layoutType: 'HIERARCHICAL',
        showDeceased: true,
        showMinors: true,
        showExtendedFamily: false,
        includeMarriages: true,
        includeGuardianships: false,
      }),
      metadata: this.buildTreeMetadata(
        familyId,
        family?.getName() || 'Immediate Family',
        validMembers,
        marriages,
      ),
    };

    this.applyHierarchicalLayout(graph, memberId);

    return graph;
  }

  // --------------------------------------------------------------------------
  // PRIVATE IMPLEMENTATION - KENYAN FAMILY STRUCTURE SUPPORT
  // --------------------------------------------------------------------------

  private buildTreeNodes(members: FamilyMember[], options: TreeLayoutOptions): TreeNode[] {
    return members
      .filter((member) => this.shouldIncludeMember(member, options))
      .map((member) => this.buildTreeNode(member));
  }

  private buildTreeNode(member: FamilyMember): TreeNode {
    const depStatus = member.getDependantStatus(); // Access Value Object from Entity
    // Note: getAge() is helper on Entity or computed
    // For now assuming we can calculate age or get null
    const age = member.getDateOfBirth() ? this.calculateAge(member.getDateOfBirth()!) : null;

    return {
      id: member.getId(),
      data: {
        label: member.getFullName(),
        fullName: member.getFullName(),
        role: member.getRole().toString(),
        isDeceased: member.getIsDeceased(),
        isMinor: member.getIsMinor(),

        // Inferred Properties (since not explicit columns on Entity)
        isFamilyHead: false,
        isElder: (age || 0) > 65,
        gender: '', // Not in schema, derived from metadata or name if AI

        dateOfBirth: member.getDateOfBirth()?.toISOString().split('T')[0],
        dateOfDeath: member.getDateOfDeath()?.toISOString().split('T')[0],
        age: age ?? undefined,

        dependencyLevel: depStatus.dependencyLevel,

        // Metadata not directly on Entity, but maybe in `notes` JSON or linked Profile
        clan: undefined,

        nodeType: 'PERSON',
        inheritanceStrength: 'MEDIUM',
        isVerified: true,
      },
      style: this.getNodeStyle(member),
    };
  }

  private buildTreeEdges(
    relationships: Relationship[],
    marriages: Marriage[],
    guardianships: Guardianship[],
    options: TreeLayoutOptions,
  ): TreeEdge[] {
    const edges: TreeEdge[] = [];

    if (options.showExtendedFamily) {
      relationships.forEach((rel) => edges.push(this.buildRelationshipEdge(rel)));
    } else {
      const immediateTypes = [
        RelationshipType.PARENT,
        RelationshipType.CHILD,
        RelationshipType.SIBLING,
      ];
      relationships
        .filter((rel) => immediateTypes.includes(rel.getType()))
        .forEach((rel) => edges.push(this.buildRelationshipEdge(rel)));
    }

    if (options.includeMarriages) {
      marriages
        .filter((marriage) => options.showDeceased || marriage.getIsActive())
        .forEach((marriage) => edges.push(this.buildMarriageEdge(marriage)));
    }

    if (options.includeGuardianships) {
      guardianships.forEach((guardianship) => edges.push(this.buildGuardianshipEdge(guardianship)));
    }

    return edges;
  }

  private buildRelationshipEdge(relationship: Relationship): TreeEdge {
    const meta = relationship.getKenyanMetadata();

    return {
      id: relationship.getId(),
      source: relationship.getFromMemberId(),
      target: relationship.getToMemberId(),
      label: relationship.getType().toLowerCase().replace('_', ' '),
      type: 'SOLID',
      edgeType: this.getRelationshipEdgeType(relationship.getType(), meta),
      metadata: {
        isVerified: relationship.getIsVerified(),
        isAdopted: meta.isAdopted,
        isBiological: meta.isBiological,
        bornOutOfWedlock: meta.bornOutOfWedlock,
      },
    };
  }

  private buildMarriageEdge(marriage: Marriage): TreeEdge {
    return {
      id: marriage.getId(),
      source: marriage.getSpouse1Id(),
      target: marriage.getSpouse2Id(),
      label: this.getMarriageLabel(marriage),
      type: marriage.getIsActive() ? 'DASHED' : 'DOTTED',
      edgeType:
        marriage.getMarriageType() === MarriageStatus.CUSTOMARY_MARRIAGE ? 'CUSTOMARY' : 'MARRIAGE',
      metadata: {
        marriageType: marriage.getMarriageType(),
        isActive: marriage.getIsActive(),
        isVerified: true,
      },
    };
  }

  private buildGuardianshipEdge(guardianship: Guardianship): TreeEdge {
    return {
      id: guardianship.getId(),
      source: guardianship.getGuardianId(),
      target: guardianship.getWardId(),
      label: 'guardian',
      type: 'DOTTED',
      edgeType: 'GUARDIANSHIP',
      metadata: {
        // Correct usage: guardianship entity doesn't have 'guardianshipType', it has 'type'
        guardianshipType: guardianship.getType(),
        isActive: guardianship.getIsActive(),
      },
    };
  }

  private buildTreeMetadata(
    familyId: string,
    familyName: string,
    members: FamilyMember[],
    marriages: Marriage[],
  ) {
    const livingMembers = members.filter((m) => !m.getIsDeceased());
    const deceasedMembers = members.filter((m) => m.getIsDeceased());
    const minors = members.filter((m) => m.getIsMinor());
    const customaryMarriages = marriages.filter(
      (m) => m.getMarriageType() === MarriageStatus.CUSTOMARY_MARRIAGE,
    );
    const polygamousMarriages = marriages.filter((m) => m.allowsPolygamy() && m.getIsActive());

    const generationCount = this.calculateGenerationCount(members);

    return {
      familyId,
      familyName,
      totalMembers: members.length,
      livingMembers: livingMembers.length,
      deceasedMembers: deceasedMembers.length,
      minorCount: minors.length,
      generationCount,
      customaryMarriages: customaryMarriages.length,
      polygamousMarriages: polygamousMarriages.length,
      lastCalculated: new Date().toISOString(),
      hasComplexStructure: polygamousMarriages.length > 0 || generationCount > 3,
    };
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  private shouldIncludeMember(member: FamilyMember, options: TreeLayoutOptions): boolean {
    if (!options.showDeceased && member.getIsDeceased()) {
      return false;
    }
    if (!options.showMinors && member.getIsMinor()) {
      return false;
    }
    return true;
  }

  private getNodeStyle(member: FamilyMember): Record<string, string | number> {
    const baseStyle: Record<string, string | number> = {
      borderRadius: '8px',
      padding: 10,
      minWidth: 120,
      textAlign: 'center',
    };

    if (member.getIsDeceased()) {
      return {
        ...baseStyle,
        backgroundColor: '#f5f5f5',
        border: '2px solid #9e9e9e',
        color: '#757575',
      };
    }

    if (member.getIsMinor()) {
      return { ...baseStyle, backgroundColor: '#e3f2fd', border: '2px solid #2196f3' };
    }

    return { ...baseStyle, backgroundColor: '#ffffff', border: '2px solid #e0e0e0' };
  }

  private getRelationshipEdgeType(
    relationshipType: RelationshipType,
    metadata: { isAdopted?: boolean },
  ): TreeEdge['edgeType'] {
    if (relationshipType === RelationshipType.GUARDIAN) return 'GUARDIANSHIP';
    if (metadata.isAdopted) return 'ADOPTION';
    return 'BLOOD';
  }

  private getMarriageLabel(marriage: Marriage): string {
    if (!marriage.getIsActive()) return 'former marriage';

    switch (marriage.getMarriageType()) {
      case MarriageStatus.CUSTOMARY_MARRIAGE:
        return 'customary marriage';
      case MarriageStatus.CIVIL_UNION:
        return 'civil union';
      default:
        return 'married';
    }
  }

  private calculateGenerationCount(members: FamilyMember[]): number {
    if (members.length === 0) return 0;
    // Simple heuristic based on roles
    const hasGrandparents = members.some((m) => m.getRole().toString().includes('GRANDPARENT'));
    const hasGrandchildren = members.some((m) => m.getRole().toString().includes('GRANDCHILD'));

    if (hasGrandparents && hasGrandchildren) return 3;
    if (hasGrandparents || hasGrandchildren) return 2;
    return 1;
  }

  private applyHierarchicalLayout(graph: TreeGraph, focusMemberId?: string): void {
    const rootId = focusMemberId || graph.nodes[0]?.id;
    if (!rootId) return;

    const nodesMap = new Map(graph.nodes.map((node) => [node.id, node]));
    const levels = new Map<string, number>();
    levels.set(rootId, 0);

    const queue = [rootId];
    const visited = new Set([rootId]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentLevel = levels.get(currentId)!;

      const connectedEdges = graph.edges.filter(
        (edge) => edge.source === currentId || edge.target === currentId,
      );

      for (const edge of connectedEdges) {
        const neighborId = edge.source === currentId ? edge.target : edge.source;
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          levels.set(neighborId, currentLevel + 1);
          queue.push(neighborId);
        }
      }
    }

    const nodesByLevel = new Map<number, TreeNode[]>();
    levels.forEach((level, nodeId) => {
      const node = nodesMap.get(nodeId);
      if (node) {
        if (!nodesByLevel.has(level)) {
          nodesByLevel.set(level, []);
        }
        nodesByLevel.get(level)!.push(node);
      }
    });

    let y = 0;
    nodesByLevel.forEach((levelNodes) => {
      const levelWidth = levelNodes.length * 150;
      let x = -levelWidth / 2;

      levelNodes.forEach((node) => {
        node.position = { x: x + 75, y: y * 100 };
        x += 150;
      });
      y++;
    });
  }
}
