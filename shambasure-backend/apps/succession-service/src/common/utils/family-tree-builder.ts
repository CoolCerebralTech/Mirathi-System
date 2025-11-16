import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { FamilyMember, User, RelationshipType, Marriage, MarriageStatus } from '@prisma/client';
import { legalRulesConfig } from '../config/legal-rules.config';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FamilyTreeNode {
  id: string;
  name: string;
  relationship: RelationshipType;
  isDeceased: boolean;
  isMinor: boolean;
  dateOfBirth?: Date;
  dateOfDeath?: Date;

  // Relationships
  spouses: FamilyTreeNode[];
  children: FamilyTreeNode[];
  parents: FamilyTreeNode[];
  siblings: FamilyTreeNode[];

  // Marriage metadata
  marriages: MarriageMetadata[];

  // Legal status
  isLegalDependant: boolean;
  isEligibleHeir: boolean;
  isDisinherited: boolean;

  // Original Prisma model for full data access
  original: FamilyMember & { user?: User | null };
}

export interface MarriageMetadata {
  id: string;
  spouseId: string;
  spouseName: string;
  marriageType: MarriageStatus;
  marriageDate: Date;
  isActive: boolean;
  divorceDate?: Date;
}

export interface FamilyTree {
  root: FamilyTreeNode;
  members: Map<string, FamilyTreeNode>;
  marriages: Map<string, Marriage>;

  // Legal metadata
  isPolygamous: boolean;
  hasMinors: boolean;
  hasIntestacy: boolean;
}

// Visualization data structures
export interface TreeVisualizationNode {
  id: string;
  label: string;
  type: 'person' | 'marriage';
  data: {
    relationship: string;
    isDeceased: boolean;
    isMinor: boolean;
    isLegalDependant: boolean;
    isEligibleHeir: boolean;
    age?: number;
    marriageType?: string;
  };
}

export interface TreeVisualizationEdge {
  from: string;
  to: string;
  label: string;
  type: 'marriage' | 'parent-child' | 'sibling';
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface TreeVisualizationData {
  nodes: TreeVisualizationNode[];
  edges: TreeVisualizationEdge[];
  rootId: string;
  metadata: {
    totalMembers: number;
    totalMarriages: number;
    legalDependants: number;
    eligibleHeirs: number;
    minors: number;
    polygamousUnits: number;
  };
}

// Legal analysis results
export interface LegalHeirAnalysis {
  eligibleHeirs: FamilyTreeNode[];
  dependants: FamilyTreeNode[];
  minorsRequiringGuardians: FamilyTreeNode[];
  polygamousUnits: PolygamousUnit[];
  intestacyScenario?: IntestacyScenario;
}

export interface PolygamousUnit {
  spouseId: string;
  spouseName: string;
  childrenIds: string[];
  unitSize: number; // For distribution calculation
}

export interface IntestacyScenario {
  scenario:
    | 'ONE_SPOUSE_WITH_CHILDREN'
    | 'MULTIPLE_SPOUSES_WITH_CHILDREN'
    | 'SPOUSE_ONLY'
    | 'RELATIVES_ONLY'
    | 'NO_HEIRS';
  spouseLifeInterest?: boolean;
  childrenAbsoluteInterest?: boolean;
  distribution: Map<string, { share: number; type: string }>;
}

// ============================================================================
// FAMILY TREE BUILDER SERVICE
// ============================================================================

@Injectable()
export class FamilyTreeBuilder {
  constructor(
    @Inject(legalRulesConfig.KEY)
    private readonly rules: ConfigType<typeof legalRulesConfig>,
  ) {}

  // ============================================================================
  // CORE TREE BUILDING
  // ============================================================================

  /**
   * Builds a complete family tree with all relationships properly linked
   * Implements Kenyan succession law requirements
   */
  public buildTreeFromMembers(
    members: (FamilyMember & { user?: User | null })[],
    marriages: Marriage[],
    rootMemberId: string,
  ): FamilyTree {
    const memberMap = new Map<string, FamilyTreeNode>();
    const marriageMap = new Map<string, Marriage>();

    // Step 1: Create nodes for all family members
    this.createFamilyNodes(members, memberMap);

    // Step 2: Store marriage data
    marriages.forEach((m) => marriageMap.set(m.id, m));

    // Step 3: Link marriages (spouse relationships)
    this.linkMarriages(marriages, memberMap);

    // Step 4: Link parent-child relationships
    this.linkParentChildRelationships(members, memberMap);

    // Step 5: Link sibling relationships
    this.linkSiblings(memberMap);

    // Step 6: Calculate legal status for each member
    this.calculateLegalStatus(memberMap, rootMemberId);

    const rootNode = memberMap.get(rootMemberId);
    if (!rootNode) {
      throw new Error('Root member not found in the provided list.');
    }

    // Detect polygamy
    const isPolygamous = this.detectPolygamy(rootNode);
    const hasMinors = Array.from(memberMap.values()).some((m) => m.isMinor);
    const hasIntestacy = !rootNode.isDeceased; // Simplified check

    return {
      root: rootNode,
      members: memberMap,
      marriages: marriageMap,
      isPolygamous,
      hasMinors,
      hasIntestacy,
    };
  }

  /**
   * Creates FamilyTreeNode objects from FamilyMember records
   */
  private createFamilyNodes(
    members: (FamilyMember & { user?: User | null })[],
    memberMap: Map<string, FamilyTreeNode>,
  ): void {
    for (const member of members) {
      const name = member.user
        ? `${member.user.firstName} ${member.user.lastName}`
        : `${member.firstName || ''} ${member.lastName || ''}`.trim();

      const node: FamilyTreeNode = {
        id: member.id,
        name: name || 'Unknown',
        relationship: member.role,
        isDeceased: member.isDeceased,
        isMinor: member.isMinor,
        dateOfBirth: member.dateOfBirth || undefined,
        dateOfDeath: member.dateOfDeath || undefined,
        spouses: [],
        children: [],
        parents: [],
        siblings: [],
        marriages: [],
        isLegalDependant: false,
        isEligibleHeir: false,
        isDisinherited: false,
        original: member,
      };

      memberMap.set(member.id, node);
    }
  }

  /**
   * Links marriage relationships between spouses
   * Handles polygamous marriages per Kenyan law
   */
  private linkMarriages(marriages: Marriage[], memberMap: Map<string, FamilyTreeNode>): void {
    for (const marriage of marriages) {
      const spouse1 = memberMap.get(marriage.spouse1Id);
      const spouse2 = memberMap.get(marriage.spouse2Id);

      if (!spouse1 || !spouse2) continue;

      // Add each as spouse of the other
      if (!spouse1.spouses.find((s) => s.id === spouse2.id)) {
        spouse1.spouses.push(spouse2);
      }
      if (!spouse2.spouses.find((s) => s.id === spouse1.id)) {
        spouse2.spouses.push(spouse1);
      }

      // Add marriage metadata
      const marriageData: MarriageMetadata = {
        id: marriage.id,
        spouseId: spouse2.id,
        spouseName: spouse2.name,
        marriageType: marriage.marriageType,
        marriageDate: marriage.marriageDate,
        isActive: marriage.isActive,
        divorceDate: marriage.divorceDate || undefined,
      };

      const reverseMarriageData: MarriageMetadata = {
        id: marriage.id,
        spouseId: spouse1.id,
        spouseName: spouse1.name,
        marriageType: marriage.marriageType,
        marriageDate: marriage.marriageDate,
        isActive: marriage.isActive,
        divorceDate: marriage.divorceDate || undefined,
      };

      spouse1.marriages.push(marriageData);
      spouse2.marriages.push(reverseMarriageData);
    }
  }

  /**
   * Links parent-child relationships
   * Uses relationship types to infer family structure
   */
  private linkParentChildRelationships(
    members: (FamilyMember & { user?: User | null })[],
    memberMap: Map<string, FamilyTreeNode>,
  ): void {
    // Define child roles in a way that TypeScript can verify
    const childRoles: Set<RelationshipType> = new Set([
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
    ]);

    // Group members by family context
    for (const member of members) {
      const node = memberMap.get(member.id);
      if (!node) continue;

      // Find parents based on relationship hints in relationshipTo field
      if (member.relationshipTo) {
        const parentMatches = this.extractParentReferences(member.relationshipTo, memberMap);
        node.parents.push(...parentMatches);

        // Add this node as child to each parent
        parentMatches.forEach((parent) => {
          if (!parent.children.find((c) => c.id === node.id)) {
            parent.children.push(node);
          }
        });
      }

      // Special handling for specific relationship types
      if (childRoles.has(member.role)) {
        // Find potential parents among other members
        this.inferParents(node, memberMap);
      }
    }
  }

  /**
   * Extracts parent references from relationshipTo field
   */
  private extractParentReferences(
    relationshipTo: string,
    memberMap: Map<string, FamilyTreeNode>,
  ): FamilyTreeNode[] {
    const parents: FamilyTreeNode[] = [];

    // Parse patterns like "Child of John Doe" or "Son of Mary Smith"
    const patterns = [/(?:child|son|daughter) of (.+)/i, /parent:? (.+)/i];

    for (const pattern of patterns) {
      const match = relationshipTo.match(pattern);
      if (match) {
        const parentName = match[1].trim();
        const parent = Array.from(memberMap.values()).find((m) =>
          m.name.toLowerCase().includes(parentName.toLowerCase()),
        );
        if (parent) parents.push(parent);
      }
    }

    return parents;
  }

  /**
   * Infers parent-child relationships based on context
   */
  private inferParents(childNode: FamilyTreeNode, memberMap: Map<string, FamilyTreeNode>): void {
    // Find members with PARENT relationship type who could be parents
    const potentialParents = Array.from(memberMap.values()).filter(
      (m) => m.relationship === RelationshipType.PARENT,
    );

    // Add age-based validation if dates are available
    for (const parent of potentialParents) {
      if (this.isPlausibleParent(parent, childNode)) {
        if (!childNode.parents.find((p) => p.id === parent.id)) {
          childNode.parents.push(parent);
        }
        if (!parent.children.find((c) => c.id === childNode.id)) {
          parent.children.push(childNode);
        }
      }
    }
  }

  /**
   * Validates if parent-child relationship is plausible based on ages
   */
  private isPlausibleParent(parent: FamilyTreeNode, child: FamilyTreeNode): boolean {
    if (!parent.dateOfBirth || !child.dateOfBirth) return true;

    const ageDiff = child.dateOfBirth.getTime() - parent.dateOfBirth.getTime();
    const yearsDiff = ageDiff / (1000 * 60 * 60 * 24 * 365.25);

    // Parents should be at least 15 years older than children
    return yearsDiff >= 15 && yearsDiff <= 70;
  }

  /**
   * Links sibling relationships based on shared parents
   */
  private linkSiblings(memberMap: Map<string, FamilyTreeNode>): void {
    for (const member of memberMap.values()) {
      if (member.parents.length === 0) continue;

      // Find siblings (share at least one parent)
      for (const parent of member.parents) {
        for (const potentialSibling of parent.children) {
          if (potentialSibling.id === member.id) continue;

          // Check if already added
          if (!member.siblings.find((s) => s.id === potentialSibling.id)) {
            member.siblings.push(potentialSibling);
          }
        }
      }
    }
  }

  // ============================================================================
  // LEGAL STATUS CALCULATION (KENYAN LAW)
  // ============================================================================

  /**
   * Calculates legal status for each family member per Kenyan succession law
   */
  private calculateLegalStatus(memberMap: Map<string, FamilyTreeNode>, deceasedId: string): void {
    const deceased = memberMap.get(deceasedId);
    if (!deceased) return;

    for (const member of memberMap.values()) {
      // Determine if member is a legal dependant
      member.isLegalDependant = this.isLegalDependant(member, deceased);

      // Determine if eligible heir under intestacy rules
      member.isEligibleHeir = this.isEligibleHeir(member, deceased);
    }
  }

  /**
   * Determines if a person is a legal dependant per Section 26-29
   */
  private isLegalDependant(member: FamilyTreeNode, deceased: FamilyTreeNode): boolean {
    const dependantDefinition = this.rules.dependantProvision.dependantDefinition;

    // Check primary dependants
    if (dependantDefinition.spouses && this.isSpouse(member, deceased)) {
      return true;
    }

    if (
      dependantDefinition.children &&
      this.isChild(member, deceased) &&
      member.relationship === RelationshipType.CHILD
    ) {
      return true;
    }

    if (
      dependantDefinition.adoptedChildren &&
      member.relationship === RelationshipType.ADOPTED_CHILD
    ) {
      return true;
    }

    if (
      dependantDefinition.stepChildren &&
      member.relationship === RelationshipType.STEPCHILD &&
      this.wasMaintainedByDeceased(member, deceased)
    ) {
      return true;
    }

    // Check other secondary dependants using boolean flags
    if (dependantDefinition.parents && this.isParent(member, deceased)) {
      return true;
    }

    if (dependantDefinition.siblings && this.isSibling(member, deceased)) {
      return true;
    }

    // Check if minor and was maintained by deceased
    if (member.isMinor && this.wasMaintainedByDeceased(member, deceased)) {
      return true;
    }

    return false;
  }

  /**
   * Determines if a person is an eligible heir under intestacy rules
   */
  private isEligibleHeir(member: FamilyTreeNode, deceased: FamilyTreeNode): boolean {
    // Spouses are always eligible heirs
    if (this.isSpouse(member, deceased)) return true;

    // Children are eligible heirs
    if (this.isChild(member, deceased)) return true;

    // If no spouse or children, check relatives
    const hasSpouse = deceased.spouses.length > 0;
    const hasChildren = deceased.children.length > 0;

    if (!hasSpouse && !hasChildren) {
      // Parents, then siblings, then other relatives
      if (this.isParent(member, deceased)) return true;
      if (this.isSibling(member, deceased)) return true;

      const extendedRelativeTypes = new Set<RelationshipType>([
        RelationshipType.GRANDPARENT,
        RelationshipType.AUNT_UNCLE,
      ]);

      if (extendedRelativeTypes.has(member.relationship)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper: Check if member is spouse of deceased
   */
  private isSpouse(member: FamilyTreeNode, deceased: FamilyTreeNode): boolean {
    return (
      deceased.spouses.some((s) => s.id === member.id) &&
      member.marriages.some((m) => m.spouseId === deceased.id && m.isActive)
    );
  }

  /**
   * Helper: Check if member is child of deceased
   */
  private isChild(member: FamilyTreeNode, deceased: FamilyTreeNode): boolean {
    return deceased.children.some((c) => c.id === member.id);
  }

  /**
   * Helper: Check if member is parent of deceased
   */
  private isParent(member: FamilyTreeNode, deceased: FamilyTreeNode): boolean {
    return deceased.parents.some((p) => p.id === member.id);
  }

  /**
   * Helper: Check if member is sibling of deceased
   */
  private isSibling(member: FamilyTreeNode, deceased: FamilyTreeNode): boolean {
    return deceased.siblings.some((s) => s.id === member.id);
  }

  /**
   * Helper: Check if member was maintained by deceased
   */
  private wasMaintainedByDeceased(member: FamilyTreeNode, deceased: FamilyTreeNode): boolean {
    // Check if member is a child or stepchild
    if (this.isChild(member, deceased)) return true;

    // Check if member's parent is spouse of deceased
    return member.parents.some((parent) => this.isSpouse(parent, deceased));
  }

  // ============================================================================
  // LEGAL ANALYSIS (KENYAN SUCCESSION LAW)
  // ============================================================================

  /**
   * Performs comprehensive legal analysis per Kenyan succession law
   */
  public analyzeLegalHeirs(tree: FamilyTree): LegalHeirAnalysis {
    const eligibleHeirs = this.findEligibleHeirs(tree);
    const dependants = this.findDependants(tree);
    const minorsRequiringGuardians = this.findMinorsRequiringGuardians(tree);
    const polygamousUnits = this.identifyPolygamousUnits(tree);
    const intestacyScenario = this.determineIntestacyScenario(tree);

    return {
      eligibleHeirs,
      dependants,
      minorsRequiringGuardians,
      polygamousUnits,
      intestacyScenario,
    };
  }

  /**
   * Finds all eligible heirs under intestacy rules
   */
  public findEligibleHeirs(tree: FamilyTree): FamilyTreeNode[] {
    return Array.from(tree.members.values()).filter(
      (member) => member.isEligibleHeir && !member.isDisinherited,
    );
  }

  /**
   * Finds all legal dependants requiring provision
   */
  public findDependants(tree: FamilyTree): FamilyTreeNode[] {
    return Array.from(tree.members.values()).filter(
      (member) => member.isLegalDependant && !member.isDisinherited,
    );
  }

  /**
   * Finds minors requiring guardian appointment
   */
  public findMinorsRequiringGuardians(tree: FamilyTree): FamilyTreeNode[] {
    return Array.from(tree.members.values()).filter((member) => {
      if (!member.isMinor) return false;

      // Check if member has living parents
      const hasLivingParent = member.parents.some((p) => !p.isDeceased);

      // Needs guardian if no living parents and is a beneficiary
      return !hasLivingParent && (member.isEligibleHeir || member.isLegalDependant);
    });
  }

  /**
   * Identifies polygamous family units for distribution calculation
   * Implements Section 40 (Multiple Spouses with Children)
   */
  public identifyPolygamousUnits(tree: FamilyTree): PolygamousUnit[] {
    const units: PolygamousUnit[] = [];
    const deceased = tree.root;

    // Check if deceased had multiple active marriages
    const activeSpouses = deceased.spouses.filter((spouse) => {
      const marriage = deceased.marriages.find((m) => m.spouseId === spouse.id);
      return marriage?.isActive;
    });

    if (activeSpouses.length <= 1) {
      return units; // Not polygamous
    }

    // Create a unit for each wife and her children
    for (const spouse of activeSpouses) {
      const childrenWithSpouse = deceased.children.filter((child) => {
        // Check if child has this spouse as a parent
        return child.parents.some((p) => p.id === spouse.id);
      });

      units.push({
        spouseId: spouse.id,
        spouseName: spouse.name,
        childrenIds: childrenWithSpouse.map((c) => c.id),
        unitSize: 1 + childrenWithSpouse.length, // 1 wife + n children
      });
    }

    return units;
  }

  /**
   * Determines the intestacy scenario and calculates distribution
   */
  public determineIntestacyScenario(tree: FamilyTree): IntestacyScenario {
    const deceased = tree.root;
    const activeSpouses = deceased.spouses.filter((s) => {
      const marriage = deceased.marriages.find((m) => m.spouseId === s.id);
      return marriage?.isActive;
    });
    const children = deceased.children;

    // Scenario 1: One spouse with children (Section 38)
    if (activeSpouses.length === 1 && children.length > 0) {
      return {
        scenario: 'ONE_SPOUSE_WITH_CHILDREN',
        spouseLifeInterest: true,
        childrenAbsoluteInterest: true,
        distribution: this.calculateOneSpouseWithChildrenDistribution(activeSpouses[0], children),
      };
    }

    // Scenario 2: Multiple spouses with children (Section 40)
    if (activeSpouses.length > 1 && children.length > 0) {
      const units = this.identifyPolygamousUnits(tree);
      return {
        scenario: 'MULTIPLE_SPOUSES_WITH_CHILDREN',
        spouseLifeInterest: false,
        childrenAbsoluteInterest: true,
        distribution: this.calculatePolygamousDistribution(units),
      };
    }

    // Scenario 3: Spouse only, no children (Section 39)
    if (activeSpouses.length > 0 && children.length === 0) {
      return {
        scenario: 'SPOUSE_ONLY',
        spouseLifeInterest: false,
        childrenAbsoluteInterest: false,
        distribution: this.calculateSpouseOnlyDistribution(activeSpouses),
      };
    }

    // Scenario 4: No spouse, no children - relatives only (Section 41)
    if (activeSpouses.length === 0 && children.length === 0) {
      return {
        scenario: 'RELATIVES_ONLY',
        spouseLifeInterest: false,
        childrenAbsoluteInterest: false,
        distribution: this.calculateRelativesOnlyDistribution(tree),
      };
    }

    // Scenario 5: No heirs at all
    return {
      scenario: 'NO_HEIRS',
      distribution: new Map(),
    };
  }

  /**
   * Calculates distribution for one spouse with children (Section 38)
   */
  private calculateOneSpouseWithChildrenDistribution(
    spouse: FamilyTreeNode,
    children: FamilyTreeNode[],
  ): Map<string, { share: number; type: string }> {
    const distribution = new Map<string, { share: number; type: string }>();

    // Spouse gets life interest in entire estate
    distribution.set(spouse.id, {
      share: 100,
      type: 'LIFE_INTEREST',
    });

    // Children get absolute interest (after spouse's life interest ends)
    const childShare = 100 / children.length;
    for (const child of children) {
      distribution.set(child.id, {
        share: childShare,
        type: 'ABSOLUTE_INTEREST_AFTER_LIFE_INTEREST',
      });
    }

    return distribution;
  }

  /**
   * Calculates distribution for polygamous families (Section 40)
   */
  private calculatePolygamousDistribution(
    units: PolygamousUnit[],
  ): Map<string, { share: number; type: string }> {
    const distribution = new Map<string, { share: number; type: string }>();

    // Calculate total units
    const totalUnits = units.reduce((sum, unit) => sum + unit.unitSize, 0);

    for (const unit of units) {
      const unitShare = (unit.unitSize / totalUnits) * 100;

      // Spouse gets 1 unit worth
      const spouseShare = (1 / unit.unitSize) * unitShare;
      distribution.set(unit.spouseId, {
        share: spouseShare,
        type: 'ABSOLUTE_INTEREST',
      });

      // Each child in the unit gets 1 unit worth
      const childShareInUnit = (1 / unit.unitSize) * unitShare;
      for (const childId of unit.childrenIds) {
        distribution.set(childId, {
          share: childShareInUnit,
          type: 'ABSOLUTE_INTEREST',
        });
      }
    }

    return distribution;
  }

  /**
   * Calculates distribution when there's only a spouse (Section 39)
   */
  private calculateSpouseOnlyDistribution(
    spouses: FamilyTreeNode[],
  ): Map<string, { share: number; type: string }> {
    const distribution = new Map<string, { share: number; type: string }>();

    // Entire estate to spouse(s)
    const spouseShare = 100 / spouses.length;
    for (const spouse of spouses) {
      distribution.set(spouse.id, {
        share: spouseShare,
        type: 'ABSOLUTE_INTEREST',
      });
    }

    return distribution;
  }

  /**
   * Calculates distribution for relatives only (Section 41)
   */
  private calculateRelativesOnlyDistribution(
    tree: FamilyTree,
  ): Map<string, { share: number; type: string }> {
    const distribution = new Map<string, { share: number; type: string }>();
    const deceased = tree.root;
    const orderOfPriority = this.rules.intestateSuccession.relativesOnly.orderOfSuccession;

    // Follow priority order: parents > siblings > grandparents > aunts/uncles > cousins
    for (const priority of orderOfPriority) {
      let eligibleRelatives: FamilyTreeNode[] = [];

      switch (priority) {
        case 'PARENTS':
          eligibleRelatives = deceased.parents.filter((p) => !p.isDeceased);
          break;
        case 'SIBLINGS_FULL': // ✅ Use SIBLINGS_FULL instead of BROTHERS_AND_SISTERS
          eligibleRelatives = deceased.siblings.filter((s) => !s.isDeceased);
          break;
        case 'HALF_SIBLINGS': // ✅ Also handle half-siblings if needed
          eligibleRelatives = this.findHalfSiblings(deceased);
          break;
        case 'GRANDPARENTS':
          eligibleRelatives = Array.from(tree.members.values()).filter(
            (m) => m.relationship === RelationshipType.GRANDPARENT && !m.isDeceased,
          );
          break;
        case 'UNCLES_AUNTS': // ✅ Use UNCLES_AUNTS instead of AUNT_UNCLE
          eligibleRelatives = this.findAuntsAndUncles(deceased);
          break;
        case 'COUSINS':
          eligibleRelatives = this.findCousins(deceased);
          break;
        // Add more cases as needed
      }

      if (eligibleRelatives.length > 0) {
        const share = 100 / eligibleRelatives.length;
        for (const relative of eligibleRelatives) {
          distribution.set(relative.id, {
            share,
            type: 'ABSOLUTE_INTEREST',
          });
        }
        break; // Stop at first non-empty priority level
      }
    }

    return distribution;
  }

  // ============================================================================
  // TREE VISUALIZATION
  // ============================================================================

  /**
   * Generates visualization data for family tree with legal annotations
   */
  public generateTreeVisualization(tree: FamilyTree): TreeVisualizationData {
    const nodes: TreeVisualizationNode[] = [];
    const edges: TreeVisualizationEdge[] = [];
    const processedMarriageEdges = new Set<string>();

    let legalDependantCount = 0;
    let eligibleHeirCount = 0;
    let minorCount = 0;

    // Create person nodes
    for (const member of tree.members.values()) {
      const age = this.calculateAge(member);

      nodes.push({
        id: member.id,
        label: member.name,
        type: 'person',
        data: {
          relationship: member.relationship,
          isDeceased: member.isDeceased,
          isMinor: member.isMinor,
          isLegalDependant: member.isLegalDependant,
          isEligibleHeir: member.isEligibleHeir,
          age,
        },
      });

      if (member.isLegalDependant) legalDependantCount++;
      if (member.isEligibleHeir) eligibleHeirCount++;
      if (member.isMinor) minorCount++;

      // Create parent-child edges
      for (const parent of member.parents) {
        edges.push({
          from: parent.id,
          to: member.id,
          label: 'parent',
          type: 'parent-child',
          style: 'solid',
        });
      }

      // Create marriage edges
      for (const marriage of member.marriages) {
        const edgeKey = [member.id, marriage.spouseId].sort().join('-');

        if (!processedMarriageEdges.has(edgeKey)) {
          const marriageLabel = marriage.isActive
            ? `${marriage.marriageType}`
            : `Divorced (${marriage.marriageType})`;

          edges.push({
            from: member.id,
            to: marriage.spouseId,
            label: marriageLabel,
            type: 'marriage',
            style: marriage.isActive ? 'solid' : 'dashed',
          });

          processedMarriageEdges.add(edgeKey);
        }
      }
    }

    const polygamousUnits = this.identifyPolygamousUnits(tree);

    return {
      nodes,
      edges,
      rootId: tree.root.id,
      metadata: {
        totalMembers: tree.members.size,
        totalMarriages: tree.marriages.size,
        legalDependants: legalDependantCount,
        eligibleHeirs: eligibleHeirCount,
        minors: minorCount,
        polygamousUnits: polygamousUnits.length,
      },
    };
  }

  /**
   * Calculates age from date of birth
   */
  private calculateAge(member: FamilyTreeNode): number | undefined {
    if (!member.dateOfBirth) return undefined;

    const endDate = member.isDeceased && member.dateOfDeath ? member.dateOfDeath : new Date();

    const ageMs = endDate.getTime() - member.dateOfBirth.getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));
  }

  // ============================================================================
  // TREE VALIDATION & INTEGRITY
  // ============================================================================

  /**
   * Validates family tree integrity and legal compliance
   */
  public validateTreeIntegrity(tree: FamilyTree): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for circular relationships
    if (this.hasCircularRelationships(tree)) {
      issues.push('Circular parent-child relationships detected');
    }

    // Check for duplicate marriages
    if (this.hasDuplicateMarriages(tree)) {
      issues.push('Duplicate marriage records detected');
    }

    // Check for orphaned members
    const orphans = this.findOrphanedMembers(tree);
    if (orphans.length > 0) {
      warnings.push(`${orphans.length} members with no relationships to family tree`);
    }

    // Validate marriage rules
    const marriageIssues = this.validateMarriages(tree);
    issues.push(...marriageIssues);

    // Validate age consistency
    const ageIssues = this.validateAgeConsistency(tree);
    warnings.push(...ageIssues);

    // Check for missing legal requirements
    const legalIssues = this.validateLegalRequirements(tree);
    warnings.push(...legalIssues);

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Detects circular parent-child relationships (impossible in real families)
   */
  private hasCircularRelationships(tree: FamilyTree): boolean {
    const visited = new Set<string>();

    const dfs = (node: FamilyTreeNode, path: Set<string>): boolean => {
      if (path.has(node.id)) return true; // Cycle detected
      if (visited.has(node.id)) return false;

      visited.add(node.id);
      path.add(node.id);

      for (const child of node.children) {
        if (dfs(child, new Set(path))) return true;
      }

      return false;
    };

    return dfs(tree.root, new Set());
  }

  /**
   * Checks for duplicate marriage records
   */
  private hasDuplicateMarriages(tree: FamilyTree): boolean {
    const marriagePairs = new Set<string>();

    for (const marriage of tree.marriages.values()) {
      const pair = [marriage.spouse1Id, marriage.spouse2Id].sort().join('-');

      if (marriagePairs.has(pair)) {
        // Check if it's a remarriage (divorced then remarried)
        const existingMarriages = Array.from(tree.marriages.values()).filter((m) => {
          const mPair = [m.spouse1Id, m.spouse2Id].sort().join('-');
          return mPair === pair;
        });

        // Allow multiple marriages if some are inactive
        const activeCount = existingMarriages.filter((m) => m.isActive).length;
        if (activeCount > 1) return true;
      }

      marriagePairs.add(pair);
    }

    return false;
  }

  /**
   * Finds members with no relationships (potential data issues)
   */
  private findOrphanedMembers(tree: FamilyTree): FamilyTreeNode[] {
    const orphans: FamilyTreeNode[] = [];

    for (const member of tree.members.values()) {
      // Skip the root
      if (member.id === tree.root.id) continue;

      // Check if member has any relationships
      const hasRelationships =
        member.spouses.length > 0 ||
        member.parents.length > 0 ||
        member.children.length > 0 ||
        member.siblings.length > 0;

      if (!hasRelationships) {
        orphans.push(member);
      }
    }

    return orphans;
  }

  /**
   * Validates marriage rules per Kenyan law
   */
  private validateMarriages(tree: FamilyTree): string[] {
    const issues: string[] = [];

    // Check for civil marriage polygamy (not allowed)
    for (const member of tree.members.values()) {
      const activeMarriages = member.marriages.filter((m) => m.isActive);

      if (activeMarriages.length > 1) {
        const hasCivilMarriage = activeMarriages.some(
          (m) => m.marriageType === MarriageStatus.MARRIED,
        );

        if (hasCivilMarriage) {
          issues.push(
            `${member.name} has multiple active marriages including civil marriage (not allowed per Kenyan law)`,
          );
        }
      }

      // Check Islamic marriage limit (max 4 wives)
      const islamicMarriages = activeMarriages.filter(
        (m) => m.marriageType === MarriageStatus.CUSTOMARY_MARRIAGE,
      );

      if (islamicMarriages.length > this.rules.familyLaw.islamic.maxSpouses) {
        issues.push(
          `${member.name} has more than ${this.rules.familyLaw.islamic.maxSpouses} active Islamic marriages`,
        );
      }
    }

    return issues;
  }

  /**
   * Validates age consistency in the family tree
   */
  private validateAgeConsistency(tree: FamilyTree): string[] {
    const warnings: string[] = [];

    for (const member of tree.members.values()) {
      // Check parent-child age differences
      for (const parent of member.parents) {
        if (!parent.dateOfBirth || !member.dateOfBirth) continue;

        const ageDiff = member.dateOfBirth.getTime() - parent.dateOfBirth.getTime();
        const yearsDiff = ageDiff / (1000 * 60 * 60 * 24 * 365.25);

        if (yearsDiff < 15) {
          warnings.push(
            `${parent.name} and ${member.name}: Parent-child age difference less than 15 years`,
          );
        }

        if (yearsDiff > 70) {
          warnings.push(
            `${parent.name} and ${member.name}: Parent-child age difference greater than 70 years`,
          );
        }
      }

      // Check if deceased date is after birth date
      if (member.dateOfDeath && member.dateOfBirth) {
        if (member.dateOfDeath < member.dateOfBirth) {
          warnings.push(`${member.name}: Death date is before birth date`);
        }
      }
    }

    return warnings;
  }

  /**
   * Validates legal requirements for succession
   */
  private validateLegalRequirements(tree: FamilyTree): string[] {
    const warnings: string[] = [];

    // Check if minors have guardians
    const minorsWithoutGuardians = this.findMinorsRequiringGuardians(tree);
    if (minorsWithoutGuardians.length > 0) {
      warnings.push(
        `${minorsWithoutGuardians.length} minor beneficiaries require guardian appointment`,
      );
    }

    // Check for dependants without provision
    const dependants = this.findDependants(tree);
    if (dependants.length === 0 && tree.members.size > 1) {
      warnings.push('No legal dependants identified in family tree');
    }

    // Check for polygamous families
    if (tree.isPolygamous) {
      warnings.push(
        'Polygamous family structure detected - special distribution rules apply (Section 40)',
      );
    }

    return warnings;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Detects if the family structure is polygamous
   */
  private detectPolygamy(root: FamilyTreeNode): boolean {
    const activeMarriages = root.marriages.filter((m) => m.isActive);
    return activeMarriages.length > 1;
  }

  /**
   * Finds all descendants of a given node
   */
  public findDescendants(node: FamilyTreeNode): FamilyTreeNode[] {
    const descendants: FamilyTreeNode[] = [];
    const visited = new Set<string>();

    const traverse = (current: FamilyTreeNode) => {
      if (visited.has(current.id)) return;
      visited.add(current.id);

      for (const child of current.children) {
        descendants.push(child);
        traverse(child);
      }
    };

    traverse(node);
    return descendants;
  }

  /**
   * Finds all ancestors of a given node
   */
  public findAncestors(node: FamilyTreeNode): FamilyTreeNode[] {
    const ancestors: FamilyTreeNode[] = [];
    const visited = new Set<string>();

    const traverse = (current: FamilyTreeNode) => {
      if (visited.has(current.id)) return;
      visited.add(current.id);

      for (const parent of current.parents) {
        ancestors.push(parent);
        traverse(parent);
      }
    };

    traverse(node);
    return ancestors;
  }

  /**
   * Calculates degree of relationship between two members
   * Returns number of generations between them
   */
  public calculateRelationshipDegree(
    person1: FamilyTreeNode,
    person2: FamilyTreeNode,
  ): number | null {
    // BFS to find shortest path
    const queue: Array<{ node: FamilyTreeNode; depth: number }> = [{ node: person1, depth: 0 }];
    const visited = new Set<string>([person1.id]);

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;

      if (node.id === person2.id) {
        return depth;
      }

      // Add all connected nodes
      const connected = [...node.parents, ...node.children, ...node.spouses, ...node.siblings];

      for (const nextNode of connected) {
        if (!visited.has(nextNode.id)) {
          visited.add(nextNode.id);
          queue.push({ node: nextNode, depth: depth + 1 });
        }
      }
    }

    return null; // No relationship found
  }

  /**
   * Generates a textual description of the relationship between two members
   */
  public describeRelationship(person1: FamilyTreeNode, person2: FamilyTreeNode): string {
    // Direct relationships (same as before)
    if (person1.spouses.some((s) => s.id === person2.id)) {
      const marriage = person1.marriages.find((m) => m.spouseId === person2.id);
      return marriage?.isActive ? 'Spouse' : 'Ex-spouse';
    }

    if (person1.children.some((c) => c.id === person2.id)) {
      return 'Child';
    }

    if (person1.parents.some((p) => p.id === person2.id)) {
      return 'Parent';
    }

    if (person1.siblings.some((s) => s.id === person2.id)) {
      const sharedParents = person1.parents.filter((p1) =>
        person2.parents.some((p2) => p2.id === p1.id),
      );
      return sharedParents.length === 2 ? 'Sibling' : 'Half-sibling';
    }

    // Extended relationships
    const person1Ancestors = this.findAncestors(person1);
    const person2Ancestors = this.findAncestors(person2);

    // Grandparent/Grandchild using helper method
    if (person1Ancestors.some((a) => a.id === person2.id)) {
      // ✅ FIX: Use helper method that handles null safely
      return this.describeAncestralRelationship(person2, person1, 'ancestor');
    }

    if (person2Ancestors.some((a) => a.id === person1.id)) {
      // ✅ FIX: Use helper method that handles null safely
      return this.describeAncestralRelationship(person1, person2, 'descendant');
    }

    // Aunt/Uncle or Niece/Nephew
    for (const parent of person1.parents) {
      if (parent.siblings.some((s) => s.id === person2.id)) {
        return 'Aunt/Uncle';
      }
    }

    for (const parent of person2.parents) {
      if (parent.siblings.some((s) => s.id === person1.id)) {
        return 'Niece/Nephew';
      }
    }

    // Cousins
    const person1Parents = person1.parents;
    const person2Parents = person2.parents;

    for (const p1 of person1Parents) {
      for (const p2 of person2Parents) {
        if (p1.siblings.some((s) => s.id === p2.id)) {
          return 'Cousin';
        }
      }
    }

    return 'Distant relative';
  }

  /**
   * Exports family tree to JSON format
   */
  public exportToJson(tree: FamilyTree): string {
    const exportData = {
      root: {
        id: tree.root.id,
        name: tree.root.name,
      },
      members: Array.from(tree.members.values()).map((m) => ({
        id: m.id,
        name: m.name,
        relationship: m.relationship,
        isDeceased: m.isDeceased,
        isMinor: m.isMinor,
        dateOfBirth: m.dateOfBirth,
        dateOfDeath: m.dateOfDeath,
        spouseIds: m.spouses.map((s) => s.id),
        childrenIds: m.children.map((c) => c.id),
        parentIds: m.parents.map((p) => p.id),
        siblingIds: m.siblings.map((s) => s.id),
        isLegalDependant: m.isLegalDependant,
        isEligibleHeir: m.isEligibleHeir,
        isDisinherited: m.isDisinherited,
      })),
      marriages: Array.from(tree.marriages.values()).map((m) => ({
        id: m.id,
        spouse1Id: m.spouse1Id,
        spouse2Id: m.spouse2Id,
        marriageType: m.marriageType,
        marriageDate: m.marriageDate,
        isActive: m.isActive,
        divorceDate: m.divorceDate,
      })),
      metadata: {
        isPolygamous: tree.isPolygamous,
        hasMinors: tree.hasMinors,
        hasIntestacy: tree.hasIntestacy,
        generatedAt: new Date().toISOString(),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generates a summary report of the family tree
   */
  public generateSummaryReport(tree: FamilyTree): string {
    const analysis = this.analyzeLegalHeirs(tree);
    const validation = this.validateTreeIntegrity(tree);

    let report = '='.repeat(80) + '\n';
    report += 'FAMILY TREE ANALYSIS REPORT\n';
    report += 'Kenyan Succession Law (Law of Succession Act Cap 160)\n';
    report += '='.repeat(80) + '\n\n';

    // Basic information
    report += `Root: ${tree.root.name}\n`;
    report += `Total Members: ${tree.members.size}\n`;
    report += `Total Marriages: ${tree.marriages.size}\n`;
    report += `Polygamous Structure: ${tree.isPolygamous ? 'Yes' : 'No'}\n\n`;

    // Legal analysis
    report += '--- LEGAL ANALYSIS ---\n';
    report += `Eligible Heirs: ${analysis.eligibleHeirs.length}\n`;
    analysis.eligibleHeirs.forEach((heir) => {
      report += `  - ${heir.name} (${heir.relationship})\n`;
    });
    report += `\nLegal Dependants: ${analysis.dependants.length}\n`;
    analysis.dependants.forEach((dep) => {
      report += `  - ${dep.name} (${dep.relationship})\n`;
    });
    report += `\nMinors Requiring Guardians: ${analysis.minorsRequiringGuardians.length}\n`;
    analysis.minorsRequiringGuardians.forEach((minor) => {
      report += `  - ${minor.name}\n`;
    });

    // Intestacy scenario
    if (analysis.intestacyScenario) {
      report += `\n--- INTESTACY SCENARIO ---\n`;
      report += `Scenario: ${analysis.intestacyScenario.scenario}\n`;
      if (analysis.intestacyScenario.spouseLifeInterest) {
        report += `Spouse Life Interest: Yes\n`;
      }
      report += `\nDistribution:\n`;
      analysis.intestacyScenario.distribution.forEach((value, memberId) => {
        const member = tree.members.get(memberId);
        report += `  - ${member?.name}: ${value.share.toFixed(2)}% (${value.type})\n`;
      });
    }

    // Polygamous units
    if (analysis.polygamousUnits.length > 0) {
      report += `\n--- POLYGAMOUS UNITS ---\n`;
      analysis.polygamousUnits.forEach((unit, index) => {
        report += `Unit ${index + 1}: ${unit.spouseName}\n`;
        report += `  Children: ${unit.childrenIds.length}\n`;
        report += `  Unit Size: ${unit.unitSize}\n`;
      });
    }

    // Validation results
    report += `\n--- VALIDATION ---\n`;
    report += `Status: ${validation.isValid ? 'Valid' : 'Issues Found'}\n`;
    if (validation.issues.length > 0) {
      report += `Issues:\n`;
      validation.issues.forEach((issue) => (report += `  ⚠️  ${issue}\n`));
    }
    if (validation.warnings.length > 0) {
      report += `Warnings:\n`;
      validation.warnings.forEach((warning) => (report += `  ⚠️  ${warning}\n`));
    }

    report += '\n' + '='.repeat(80) + '\n';
    report += 'Report Generated: ' + new Date().toISOString() + '\n';
    report += '='.repeat(80) + '\n';

    return report;
  }
  private findHalfSiblings(deceased: FamilyTreeNode): FamilyTreeNode[] {
    // Find siblings who share only one parent
    return deceased.siblings
      .filter((sibling) => {
        const sharedParents = deceased.parents.filter((parent) =>
          sibling.parents.some((siblingParent) => siblingParent.id === parent.id),
        );
        return sharedParents.length === 1; // Half-siblings share exactly one parent
      })
      .filter((s) => !s.isDeceased);
  }

  private findAuntsAndUncles(deceased: FamilyTreeNode): FamilyTreeNode[] {
    const auntsUncles: FamilyTreeNode[] = [];

    // Aunts/uncles are siblings of parents
    for (const parent of deceased.parents) {
      auntsUncles.push(...parent.siblings);
    }

    return auntsUncles.filter((relative) => !relative.isDeceased);
  }

  private findCousins(deceased: FamilyTreeNode): FamilyTreeNode[] {
    const cousins: FamilyTreeNode[] = [];

    // Cousins are children of aunts/uncles
    const auntsUncles = this.findAuntsAndUncles(deceased);
    for (const auntUncle of auntsUncles) {
      cousins.push(...auntUncle.children);
    }

    return cousins.filter((relative) => !relative.isDeceased);
  }
  private describeAncestralRelationship(
    ancestor: FamilyTreeNode,
    descendant: FamilyTreeNode,
    direction: 'ancestor' | 'descendant',
  ): string {
    const degree = this.calculateRelationshipDegree(ancestor, descendant);

    if (degree === null) {
      return direction === 'ancestor' ? 'Ancestor' : 'Descendant';
    }

    if (degree === 2) {
      return direction === 'ancestor' ? 'Grandparent' : 'Grandchild';
    }

    if (degree === 3) {
      return direction === 'ancestor' ? 'Great-grandparent' : 'Great-grandchild';
    }

    if (degree > 3) {
      const greatCount = degree - 1;
      const prefix = greatCount === 1 ? 'Great-' : `${greatCount}x Great-`;
      return direction === 'ancestor' ? `${prefix}grandparent` : `${prefix}grandchild`;
    }

    return direction === 'ancestor' ? 'Ancestor' : 'Descendant';
  }
}
