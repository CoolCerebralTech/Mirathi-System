import { Injectable, Inject } from '@nestjs/common';
import type { FamilyMemberRepositoryInterface } from '../interfaces/family-member.repository.interface';
import type { RelationshipRepositoryInterface } from '../interfaces/relationship.repository.interface';
import type { MarriageRepositoryInterface } from '../interfaces/marriage.repository.interface';
import type { GuardianshipRepositoryInterface } from '../interfaces/guardianship.repository.interface';
import type { FamilyRepositoryInterface } from '../interfaces/family.repository.interface';
import type { FamilyMember } from '../entities/family-member.entity';
import type { Relationship, RelationshipMetadata } from '../entities/relationship.entity';
import type { Marriage } from '../entities/marriage.entity';
import type { Guardianship } from '../entities/guardianship.entity';

export interface TreeNode {
  id: string;
  data: {
    label: string;
    fullName: string;
    role: string;
    relationshipType?: string;
    isDeceased: boolean;
    isMinor: boolean;
    isFamilyHead: boolean;
    isElder: boolean;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth?: string;
    dateOfDeath?: string;
    age?: number;
    disabilityStatus?: string;
    dependencyLevel: 'FULL' | 'PARTIAL' | 'INDEPENDENT';
    clan?: string;
    traditionalTitle?: string;
    image?: string;
    nodeType: 'PERSON' | 'SPOUSE_GROUP' | 'POLYGAMOUS_SPOUSE';
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
    guardianshipType?: string;
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
    rootMemberId?: string;
    hasComplexStructure: boolean;
  };
}

export interface TreeLayoutOptions {
  layoutType: 'HIERARCHICAL' | 'RADIAL' | 'CUSTOM';
  showDeceased: boolean;
  showMinors: boolean;
  showExtendedFamily: boolean;
  focusMemberId?: string;
  maxGenerations?: number;
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
    // 1. Parallel Fetch with Enhanced Data
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

    // 2. Build Nodes with Enhanced Kenyan Attributes
    graph.nodes = await this.buildTreeNodes(members, options);

    // 3. Build Edges with Enhanced Relationship Types
    graph.edges = await this.buildTreeEdges(relationships, marriages, guardianships, options);

    // 4. Apply Layout if specified
    if (options.layoutType === 'HIERARCHICAL') {
      this.applyHierarchicalLayout(graph, options.focusMemberId);
    }

    return graph;
  }

  /**
   * Builds a simplified tree for immediate family (Spouse + Children + Parents)
   */
  async buildImmediateFamily(memberId: string): Promise<TreeGraph> {
    const member = await this.memberRepo.findById(memberId);
    if (!member) {
      throw new Error(`Member with ID ${memberId} not found`);
    }

    const familyId = member.getFamilyId();

    // Get immediate relationships
    const [outgoingRels, incomingRels, marriages, family] = await Promise.all([
      this.relationshipRepo.findByFromMemberId(memberId),
      this.relationshipRepo.findByToMemberId(memberId),
      this.marriageRepo.findByMemberId(memberId),
      this.familyRepo.findById(familyId),
    ]);

    // Collect all relevant member IDs
    const relevantMemberIds = new Set<string>();
    relevantMemberIds.add(memberId);

    // Add spouses
    marriages.forEach((marriage) => {
      relevantMemberIds.add(marriage.getSpouse1Id());
      relevantMemberIds.add(marriage.getSpouse2Id());
    });

    // Add direct relationships
    outgoingRels.forEach((rel) => relevantMemberIds.add(rel.getToMemberId()));
    incomingRels.forEach((rel) => relevantMemberIds.add(rel.getFromMemberId()));

    // Fetch all relevant members
    const members = await Promise.all(
      Array.from(relevantMemberIds).map((id) => this.memberRepo.findById(id)),
    );
    const validMembers = members.filter((m): m is FamilyMember => m !== null);

    // Build the graph
    const graph: TreeGraph = {
      nodes: await this.buildTreeNodes(validMembers, {
        layoutType: 'HIERARCHICAL',
        showDeceased: true,
        showMinors: true,
        showExtendedFamily: false,
        includeMarriages: true,
        includeGuardianships: false,
      }),
      edges: await this.buildTreeEdges([...outgoingRels, ...incomingRels], marriages, [], {
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

    // Center on the focus member
    this.applyHierarchicalLayout(graph, memberId);

    return graph;
  }

  /**
   * Builds a succession-focused tree showing potential heirs and dependants
   */
  async buildSuccessionTree(familyId: string, deceasedMemberId: string): Promise<TreeGraph> {
    const [fullTree, potentialHeirs] = await Promise.all([
      this.buildFullTree(familyId, {
        layoutType: 'HIERARCHICAL',
        showDeceased: true,
        showMinors: true,
        showExtendedFamily: true,
        includeMarriages: true,
        includeGuardianships: true,
      }),
      this.memberRepo.findPotentialHeirs(familyId, deceasedMemberId),
    ]);

    // Enhance nodes with succession information
    const heirIds = new Set(potentialHeirs.map((heir) => heir.getId()));

    fullTree.nodes = fullTree.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        inheritanceStrength: this.calculateInheritanceStrength(node.id, heirIds, fullTree.edges),
        nodeType: node.id === deceasedMemberId ? 'PERSON' : node.data.nodeType,
      },
      style:
        node.id === deceasedMemberId
          ? { backgroundColor: '#ffebee', border: '2px solid #f44336' }
          : heirIds.has(node.id)
            ? { backgroundColor: '#e8f5e8', border: '2px solid #4caf50' }
            : node.style,
    }));

    // Highlight relationships to deceased
    fullTree.edges = fullTree.edges.map((edge) => ({
      ...edge,
      style:
        edge.source === deceasedMemberId || edge.target === deceasedMemberId
          ? { stroke: '#ff6b6b', strokeWidth: 3 }
          : edge.style,
    }));

    fullTree.metadata.hasComplexStructure = this.hasComplexSuccessionStructure(fullTree);

    return fullTree;
  }

  /**
   * Builds an ancestral tree showing lineage and clan connections
   */
  async buildAncestralTree(memberId: string, generations: number = 3): Promise<TreeGraph> {
    const member = await this.memberRepo.findById(memberId);
    if (!member) {
      throw new Error(`Member with ID ${memberId} not found`);
    }

    const familyId = member.getFamilyId();

    // Get ancestral relationships
    const ancestralRels = await this.relationshipRepo.findAncestralLineage(memberId, generations);
    const ancestralMemberIds = new Set<string>([memberId]);

    ancestralRels.forEach((rel) => {
      ancestralMemberIds.add(rel.getFromMemberId());
      ancestralMemberIds.add(rel.getToMemberId());
    });

    // Fetch ancestral members
    const members = await Promise.all(
      Array.from(ancestralMemberIds).map((id) => this.memberRepo.findById(id)),
    );
    const validMembers = members.filter((m): m is FamilyMember => m !== null);

    // Build clan-focused graph
    const graph: TreeGraph = {
      nodes: await this.buildTreeNodes(validMembers, {
        layoutType: 'HIERARCHICAL',
        showDeceased: true,
        showMinors: true,
        showExtendedFamily: false,
        includeMarriages: true,
        includeGuardianships: false,
      }),
      edges: await this.buildTreeEdges(ancestralRels, [], [], {
        layoutType: 'HIERARCHICAL',
        showDeceased: true,
        showMinors: true,
        showExtendedFamily: false,
        includeMarriages: false,
        includeGuardianships: false,
      }),
      metadata: this.buildTreeMetadata(familyId, 'Ancestral Tree', validMembers, []),
    };

    // Enhance with clan information
    graph.nodes = graph.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        style: this.getClanStyle(node.data.clan),
      },
    }));

    this.applyHierarchicalLayout(graph, memberId);

    return graph;
  }

  // --------------------------------------------------------------------------
  // PRIVATE IMPLEMENTATION - KENYAN FAMILY STRUCTURE SUPPORT
  // --------------------------------------------------------------------------

  private async buildTreeNodes(
    members: FamilyMember[],
    options: TreeLayoutOptions,
  ): Promise<TreeNode[]> {
    return members
      .filter((member) => this.shouldIncludeMember(member, options))
      .map((member) => this.buildTreeNode(member));
  }

  private buildTreeNode(member: FamilyMember): TreeNode {
    const metadata = member.getMetadata();
    const age = member.getAge();

    return {
      id: member.getId(),
      data: {
        label: member.getFullName(),
        fullName: member.getFullName(),
        role: member.getRole(),
        isDeceased: member.getIsDeceased(),
        isMinor: member.getIsMinor(),
        isFamilyHead: metadata.isFamilyHead,
        isElder: metadata.isElder,
        gender: member.getGender() as 'MALE' | 'FEMALE' | 'OTHER',
        dateOfBirth: member.getDateOfBirth()?.toISOString().split('T')[0],
        dateOfDeath: member.getDateOfDeath()?.toISOString().split('T')[0],
        age: age !== null ? age : undefined,
        disabilityStatus: metadata.disabilityStatus,
        dependencyLevel: metadata.dependencyStatus,
        clan: metadata.clan,
        traditionalTitle: metadata.traditionalTitle,
        nodeType: 'PERSON',
        inheritanceStrength: 'MEDIUM',
        isVerified: true, // Would check relationships for verification
      },
      style: this.getNodeStyle(member),
    };
  }

  private async buildTreeEdges(
    relationships: Relationship[],
    marriages: Marriage[],
    guardianships: Guardianship[],
    options: TreeLayoutOptions,
  ): Promise<TreeEdge[]> {
    const edges: TreeEdge[] = [];

    // Add blood relationships
    if (options.showExtendedFamily) {
      relationships.forEach((rel) => {
        edges.push(this.buildRelationshipEdge(rel));
      });
    } else {
      // Only immediate family relationships
      const immediateTypes = ['PARENT', 'CHILD', 'SIBLING'];
      relationships
        .filter((rel) => immediateTypes.includes(rel.getType()))
        .forEach((rel) => {
          edges.push(this.buildRelationshipEdge(rel));
        });
    }

    // Add marriages
    if (options.includeMarriages) {
      marriages
        .filter((marriage) => options.showDeceased || marriage.getIsActive())
        .forEach((marriage) => {
          edges.push(this.buildMarriageEdge(marriage));
        });
    }

    // Add guardianships
    if (options.includeGuardianships) {
      guardianships.forEach((guardianship) => {
        edges.push(this.buildGuardianshipEdge(guardianship));
      });
    }

    return edges;
  }

  private buildRelationshipEdge(relationship: Relationship): TreeEdge {
    const metadata = relationship.getMetadata();

    return {
      id: relationship.getId(),
      source: relationship.getFromMemberId(),
      target: relationship.getToMemberId(),
      label: relationship.getType().toLowerCase().replace('_', ' '),
      type: 'SOLID',
      edgeType: this.getRelationshipEdgeType(relationship.getType(), metadata),
      metadata: {
        isVerified: relationship.getIsVerified(),
        isAdopted: metadata.isAdopted,
        isBiological: metadata.isBiological,
        bornOutOfWedlock: metadata.bornOutOfWedlock,
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
      edgeType: marriage.getMarriageType() === 'CUSTOMARY_MARRIAGE' ? 'CUSTOMARY' : 'MARRIAGE',
      metadata: {
        marriageType: marriage.getMarriageType(),
        isActive: marriage.getIsActive(),
        isVerified: true, // Marriage records are typically verified
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
        guardianshipType: guardianship.getType(),
        isActive: guardianship.getIsActiveRecord(),
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
      (m) => m.getMarriageType() === 'CUSTOMARY_MARRIAGE',
    );
    const polygamousMarriages = marriages.filter((m) => m.allowsPolygamy() && m.getIsActive());

    // Calculate generations (simplified)
    const generationCount = this.calculateGenerationCount(members, marriages);

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

  private shouldIncludeMember(member: FamilyMember, options: TreeLayoutOptions): boolean {
    if (!options.showDeceased && member.getIsDeceased()) {
      return false;
    }
    if (!options.showMinors && member.getIsMinor()) {
      return false;
    }
    return true;
  }

  private getNodeStyle(member: FamilyMember): any {
    const baseStyle = {
      borderRadius: '8px',
      padding: '10px',
      minWidth: '120px',
      textAlign: 'center' as const,
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
      return {
        ...baseStyle,
        backgroundColor: '#e3f2fd',
        border: '2px solid #2196f3',
      };
    }

    if (member.getMetadata().isFamilyHead) {
      return {
        ...baseStyle,
        backgroundColor: '#fff3e0',
        border: '2px solid #ff9800',
        fontWeight: 'bold',
      };
    }

    return {
      ...baseStyle,
      backgroundColor: '#ffffff',
      border: '2px solid #e0e0e0',
    };
  }

  private getClanStyle(clan?: string): any {
    if (!clan) return {};

    // Assign colors based on clan (simplified)
    const clanColors: Record<string, string> = {
      kikuyu: '#4caf50',
      luo: '#2196f3',
      kalenjin: '#ff9800',
      luhya: '#9c27b0',
      kamba: '#f44336',
    };

    const color = clanColors[clan.toLowerCase()] || '#607d8b';

    return {
      borderLeft: `4px solid ${color}`,
    };
  }

  private getRelationshipEdgeType(
    relationshipType: string,
    metadata: RelationshipMetadata,
  ): TreeEdge['edgeType'] {
    if (relationshipType === 'GUARDIAN') return 'GUARDIANSHIP';
    if (metadata.isAdopted) return 'ADOPTION';
    return 'BLOOD';
  }

  private getMarriageLabel(marriage: Marriage): string {
    if (!marriage.getIsActive()) return 'former marriage';

    switch (marriage.getMarriageType()) {
      case 'CUSTOMARY_MARRIAGE':
        return 'customary marriage';
      case 'CIVIL_UNION':
        return 'civil union';
      default:
        return 'married';
    }
  }

  private calculateGenerationCount(members: FamilyMember[], marriages: Marriage[]): number {
    // Simplified generation calculation
    // In a real implementation, this would do proper graph traversal
    if (members.length === 0) return 0;

    const hasGrandparents = members.some((m) => m.getRole() === 'GRANDPARENT');
    const hasGrandchildren = members.some((m) => m.getRole() === 'GRANDCHILD');

    if (hasGrandparents && hasGrandchildren) return 3;
    if (hasGrandparents || hasGrandchildren) return 2;
    return 1;
  }

  private calculateInheritanceStrength(
    memberId: string,
    heirIds: Set<string>,
    edges: TreeEdge[],
  ): 'STRONG' | 'MEDIUM' | 'WEAK' | 'NONE' {
    if (!heirIds.has(memberId)) return 'NONE';

    // Simplified calculation - in real implementation, use relationship analysis
    const directRelations = edges.filter(
      (edge) => edge.edgeType === 'BLOOD' && (edge.source === memberId || edge.target === memberId),
    );

    if (
      directRelations.some((edge) => edge.label.includes('child') || edge.label.includes('spouse'))
    ) {
      return 'STRONG';
    }

    return 'MEDIUM';
  }

  private hasComplexSuccessionStructure(tree: TreeGraph): boolean {
    const polygamousEdges = tree.edges.filter(
      (edge) => edge.edgeType === 'CUSTOMARY' && edge.metadata?.isActive,
    );

    const minorNodes = tree.nodes.filter((node) => node.data.isMinor && !node.data.isDeceased);

    return polygamousEdges.length > 1 || minorNodes.length > 0;
  }

  private applyHierarchicalLayout(graph: TreeGraph, focusMemberId?: string): void {
    // Simplified hierarchical layout
    // In a real implementation, use a proper graph layout algorithm like dagre

    const rootId = focusMemberId || graph.nodes[0]?.id;
    if (!rootId) return;

    const nodesMap = new Map(graph.nodes.map((node) => [node.id, node]));

    // Simple level assignment
    const levels = new Map<string, number>();
    levels.set(rootId, 0);

    const queue = [rootId];
    const visited = new Set([rootId]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentLevel = levels.get(currentId)!;

      // Find connected nodes
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

    // Apply positions based on levels
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
