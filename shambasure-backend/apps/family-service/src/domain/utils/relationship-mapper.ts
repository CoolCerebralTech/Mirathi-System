// domain/utils/relationship-mapper.ts
import {
  DependencyLevel,
  FamilyMember,
  FamilyRelationship,
  Guardian,
  InheritanceRights,
  KenyanLawSection,
  Marriage,
  MarriageEndReason,
  PolygamousHouse,
  RelationshipType,
} from '@prisma/client';

// =============================================================================
// INTERFACES
// =============================================================================

export interface RelationshipPathResult {
  path: RelationshipType[];
  distance: number;
  relationshipStrength: 'FULL' | 'HALF' | 'STEP' | 'ADOPTED';
  inheritanceRights: InheritanceRights;
  legalTerm: string; // e.g., "Paternal Uncle"
}

export interface PotentialDependant {
  member: FamilyMember;
  basisSection: KenyanLawSection;
  dependencyBasis: 'SPOUSE' | 'CHILD' | 'PARENT' | 'OTHER';
  suggestedDependencyLevel: DependencyLevel;
  notes: string;
}

export interface PolygamousHouseShare {
  houseId: string;
  houseName: string;
  houseOrder: number;
  members: {
    spouses: FamilyMember[];
    children: FamilyMember[];
  };
  allocationPercentage: number; // 100 / number of houses
}

export interface NextOfKinResult {
  primary: FamilyMember | null;
  secondary: FamilyMember[];
  legalGuardian: Guardian | null;
}

// =============================================================================
// MAPPER CLASS
// =============================================================================

export class RelationshipMapper {
  /**
   * 1. CORE GRAPH TRAVERSAL
   * Finds the shortest path and legal relationship between two members.
   * Uses BFS (Breadth-First Search).
   */
  static findRelationshipPath(
    fromMemberId: string,
    toMemberId: string,
    relationships: FamilyRelationship[],
    marriages: Marriage[],
  ): RelationshipPathResult | null {
    if (fromMemberId === toMemberId) return null;

    // 1. Build Adjacency Graph
    const graph = this.buildFamilyGraph(relationships, marriages);

    // 2. BFS State
    const queue: Array<{ id: string; path: RelationshipType[]; rights: InheritanceRights[] }> = [
      { id: fromMemberId, path: [], rights: [] },
    ];
    const visited = new Set<string>([fromMemberId]);

    // 3. Execute BFS
    while (queue.length > 0) {
      const current = queue.shift()!;

      // Found the target
      if (current.id === toMemberId) {
        return this.analyzePath(current.path, current.rights);
      }

      // Max depth check (prevent infinite loops in bad data, max 4 degrees for succession)
      if (current.path.length >= 4) continue;

      const neighbors = graph.get(current.id) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.to)) {
          visited.add(neighbor.to);
          queue.push({
            id: neighbor.to,
            path: [...current.path, neighbor.type],
            rights: [...current.rights, neighbor.rights],
          });
        }
      }
    }

    return null;
  }

  /**
   * 2. S.29 DEPENDANCY IDENTIFIER
   * Analyzes family data to return a list of people qualifying as S.29 Dependants.
   */
  static identifyDependants(
    deceased: FamilyMember,
    allMembers: FamilyMember[],
    relationships: FamilyRelationship[],
    marriages: Marriage[],
  ): PotentialDependant[] {
    const results: PotentialDependant[] = [];
    const processedIds = new Set<string>();

    // A. Spouses (S.29(a))
    const spouses = this.getActiveSpouses(deceased.id, marriages, allMembers);
    for (const spouse of spouses) {
      results.push({
        member: spouse,
        basisSection: KenyanLawSection.S29_DEPENDANTS,
        dependencyBasis: 'SPOUSE',
        suggestedDependencyLevel: DependencyLevel.FULL,
        notes: 'Surviving Spouse',
      });
      processedIds.add(spouse.id);
    }

    // B. Children (S.29(b)) - Biological & Adopted
    const children = this.getChildren(deceased.id, relationships, allMembers);
    for (const child of children) {
      if (processedIds.has(child.id)) continue;

      const isMinor = child.isMinor || (child.currentAge && child.currentAge < 18) || false;
      const isStudent = child.currentAge && child.currentAge <= 25 && child.currentAge >= 18;
      const isDisabled = child.disabilityStatus && child.disabilityStatus !== 'NONE';

      let level: DependencyLevel = DependencyLevel.NONE;
      let notes = '';

      if (isMinor) {
        level = DependencyLevel.FULL;
        notes = 'Minor Child';
      } else if (isDisabled) {
        level = DependencyLevel.FULL;
        notes = 'Adult Child with Disability';
      } else if (isStudent) {
        level = DependencyLevel.PARTIAL;
        notes = 'Adult Student Child';
      }

      if (level !== DependencyLevel.NONE) {
        results.push({
          member: child,
          basisSection: KenyanLawSection.S29_DEPENDANTS,
          dependencyBasis: 'CHILD',
          suggestedDependencyLevel: level,
          notes,
        });
        processedIds.add(child.id);
      }
    }

    // C. Parents (S.29(c)) - Only if deceased was supporting them
    const parents = this.getParents(deceased.id, relationships, allMembers);
    for (const parent of parents) {
      if (processedIds.has(parent.id)) continue;
      // Heuristic: Parents over 65 usually qualify for partial support consideration
      const isElderly = parent.currentAge && parent.currentAge > 65;

      if (isElderly) {
        results.push({
          member: parent,
          basisSection: KenyanLawSection.S29_DEPENDANTS,
          dependencyBasis: 'PARENT',
          suggestedDependencyLevel: DependencyLevel.PARTIAL,
          notes: 'Elderly Parent (Subject to proof of support)',
        });
      }
    }

    return results;
  }

  /**
   * 3. S.40 POLYGAMOUS DISTRIBUTION
   * Groups members by house and calculates S.40 shares.
   */
  static calculatePolygamousShares(
    deceased: FamilyMember,
    houses: PolygamousHouse[],
    allMembers: FamilyMember[],
    marriages: Marriage[],
    relationships: FamilyRelationship[],
  ): PolygamousHouseShare[] {
    const activeHouses = houses.filter((h) => !h.houseDissolvedAt);
    if (activeHouses.length === 0) return [];

    const sharePerHouse = 100 / activeHouses.length;
    const result: PolygamousHouseShare[] = [];

    for (const house of activeHouses) {
      // Find Spouses in this house
      const houseSpouseIds = marriages
        .filter((m) => m.polygamousHouseId === house.id && m.isActive)
        .map((m) => (m.spouse1Id === deceased.id ? m.spouse2Id : m.spouse1Id));

      const houseSpouses = allMembers.filter((m) => houseSpouseIds.includes(m.id) && !m.isDeceased);

      // Find Children in this house (via polymorphic ID or relationship to house Spouse)
      // 1. Direct link via familyMember.polygamousHouseId
      let houseChildren = allMembers.filter(
        (m) => m.polygamousHouseId === house.id && !m.isDeceased && m.id !== deceased.id,
      );

      // 2. If children not explicitly linked, fallback to finding children of the House Spouses
      if (houseChildren.length === 0 && houseSpouses.length > 0) {
        const spouseIds = houseSpouses.map((s) => s.id);
        const childrenOfDeceased = this.getChildren(deceased.id, relationships, allMembers);

        // Filter children who are also children of one of the house spouses
        houseChildren = childrenOfDeceased.filter((child) => {
          const childParents = this.getParents(child.id, relationships, allMembers);
          return childParents.some((p) => spouseIds.includes(p.id));
        });
      }

      result.push({
        houseId: house.id,
        houseName: house.houseName,
        houseOrder: house.houseOrder,
        allocationPercentage: sharePerHouse,
        members: {
          spouses: houseSpouses,
          children: houseChildren,
        },
      });
    }

    return result.sort((a, b) => a.houseOrder - b.houseOrder);
  }

  /**
   * 4. NEXT OF KIN DETERMINATION
   * Determines priority based on standard Kenyan hierarchy.
   */
  static determineNextOfKin(
    person: FamilyMember,
    allMembers: FamilyMember[],
    relationships: FamilyRelationship[],
    marriages: Marriage[],
    guardians: Guardian[],
  ): NextOfKinResult {
    const result: NextOfKinResult = { primary: null, secondary: [], legalGuardian: null };

    // 1. Legal Guardian (Top priority for minors)
    if (person.isMinor) {
      const activeGuardian = guardians.find((g) => g.wardId === person.id && g.isActive);
      if (activeGuardian) {
        result.legalGuardian = activeGuardian;
        // Find the guardian entity in family members
        const guardianMember = allMembers.find((m) => m.id === activeGuardian.guardianId);
        // Note: Guardian might be external, so check if found
        if (guardianMember) return { ...result, primary: guardianMember };
      }
    }

    // 2. Spouse
    const spouses = this.getActiveSpouses(person.id, marriages, allMembers);
    if (spouses.length > 0) {
      result.primary = spouses[0]; // First spouse
      if (spouses.length > 1) result.secondary.push(...spouses.slice(1));
    }

    // 3. Adult Children
    const children = this.getChildren(person.id, relationships, allMembers);
    const adultChildren = children.filter((c) => !c.isMinor);

    if (!result.primary && adultChildren.length > 0) {
      result.primary = adultChildren[0]; // Eldest usually
      result.secondary.push(...adultChildren.slice(1));
    } else {
      result.secondary.push(...adultChildren);
    }

    // 4. Parents (if no spouse/children)
    if (!result.primary) {
      const parents = this.getParents(person.id, relationships, allMembers);
      if (parents.length > 0) {
        result.primary = parents[0];
        result.secondary.push(...parents.slice(1));
      }
    }

    return result;
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private static buildFamilyGraph(relationships: FamilyRelationship[], marriages: Marriage[]) {
    const graph = new Map<
      string,
      Array<{ to: string; type: RelationshipType; rights: InheritanceRights }>
    >();

    const addEdge = (u: string, v: string, type: RelationshipType, rights: InheritanceRights) => {
      if (!graph.has(u)) graph.set(u, []);
      graph.get(u)!.push({ to: v, type, rights });
    };

    // Add blood/legal relationships
    for (const r of relationships) {
      addEdge(r.fromMemberId, r.toMemberId, r.type, r.inheritanceRights);
      addEdge(r.toMemberId, r.fromMemberId, this.getInverseType(r.type), r.inheritanceRights);
    }

    // Add marriage relationships
    for (const m of marriages) {
      if (m.isActive && m.endReason === MarriageEndReason.STILL_ACTIVE) {
        addEdge(m.spouse1Id, m.spouse2Id, RelationshipType.SPOUSE, InheritanceRights.FULL);
        addEdge(m.spouse2Id, m.spouse1Id, RelationshipType.SPOUSE, InheritanceRights.FULL);
      }
    }

    return graph;
  }

  private static analyzePath(
    path: RelationshipType[],
    rights: InheritanceRights[],
  ): RelationshipPathResult {
    // Distance calculation
    const distance = path.length;

    // Rights Calculation (Weakest link determines the chain)
    const overallRights = rights.includes(InheritanceRights.NONE)
      ? InheritanceRights.NONE
      : rights.includes(InheritanceRights.PARTIAL)
        ? InheritanceRights.PARTIAL
        : InheritanceRights.FULL;

    // Strength Calculation
    let strength: RelationshipPathResult['relationshipStrength'] = 'FULL';
    if (path.includes(RelationshipType.ADOPTED_CHILD)) strength = 'ADOPTED';
    else if (path.includes(RelationshipType.HALF_SIBLING)) strength = 'HALF';
    else if (path.includes(RelationshipType.STEPCHILD)) strength = 'STEP';

    // Generate Human Readable Term
    const legalTerm = this.generateLegalTerm(path);

    return {
      path,
      distance,
      inheritanceRights: overallRights,
      relationshipStrength: strength,
      legalTerm,
    };
  }

  // --- Entity Getters ---

  private static getActiveSpouses(
    memberId: string,
    marriages: Marriage[],
    members: FamilyMember[],
  ): FamilyMember[] {
    const spouseIds = marriages
      .filter((m) => (m.spouse1Id === memberId || m.spouse2Id === memberId) && m.isActive)
      .map((m) => (m.spouse1Id === memberId ? m.spouse2Id : m.spouse1Id));

    return members.filter((m) => spouseIds.includes(m.id) && !m.isDeceased);
  }

  private static getChildren(
    memberId: string,
    relationships: FamilyRelationship[],
    members: FamilyMember[],
  ): FamilyMember[] {
    const childrenIds = relationships
      .filter(
        (r) =>
          r.fromMemberId === memberId &&
          (r.type === RelationshipType.CHILD || r.type === RelationshipType.ADOPTED_CHILD),
      )
      .map((r) => r.toMemberId);

    // Sort by age desc (eldest first) if DOB exists
    return members
      .filter((m) => childrenIds.includes(m.id) && !m.isDeceased)
      .sort((a, b) =>
        a.dateOfBirth && b.dateOfBirth ? a.dateOfBirth.getTime() - b.dateOfBirth.getTime() : 0,
      );
  }

  private static getParents(
    memberId: string,
    relationships: FamilyRelationship[],
    members: FamilyMember[],
  ): FamilyMember[] {
    const parentIds = relationships
      .filter((r) => r.toMemberId === memberId && r.type === RelationshipType.PARENT)
      .map((r) => r.fromMemberId);

    return members.filter((m) => parentIds.includes(m.id) && !m.isDeceased);
  }

  // --- Utility Mappers ---

  private static getInverseType(type: RelationshipType): RelationshipType {
    const map: Partial<Record<RelationshipType, RelationshipType>> = {
      [RelationshipType.PARENT]: RelationshipType.CHILD,
      [RelationshipType.CHILD]: RelationshipType.PARENT,
      [RelationshipType.ADOPTED_CHILD]: RelationshipType.PARENT, // Legally parent
      [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
      [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
      [RelationshipType.AUNT_UNCLE]: RelationshipType.NIECE_NEPHEW,
      [RelationshipType.NIECE_NEPHEW]: RelationshipType.AUNT_UNCLE,
      [RelationshipType.SIBLING]: RelationshipType.SIBLING,
      [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
    };
    return map[type] || RelationshipType.OTHER;
  }

  private static generateLegalTerm(path: RelationshipType[]): string {
    if (path.length === 0) return 'Self';
    if (path.length === 1) return this.mapEnumToReadable(path[0]);

    // Simplified mapping for complex paths
    const last = path[path.length - 1];
    return `Relative (${this.mapEnumToReadable(last)})`;
  }

  static mapEnumToReadable(type: RelationshipType): string {
    switch (type) {
      case RelationshipType.SPOUSE:
        return 'Spouse';
      case RelationshipType.CHILD:
        return 'Child';
      case RelationshipType.ADOPTED_CHILD:
        return 'Adopted Child';
      case RelationshipType.PARENT:
        return 'Parent';
      case RelationshipType.SIBLING:
        return 'Sibling';
      case RelationshipType.HALF_SIBLING:
        return 'Half-Sibling';
      case RelationshipType.STEPCHILD:
        return 'Step-Child';
      case RelationshipType.GRANDPARENT:
        return 'Grandparent';
      case RelationshipType.GRANDCHILD:
        return 'Grandchild';
      default:
        return 'Relative';
    }
  }

  static mapStringToEnum(term: string): RelationshipType {
    const t = term.toUpperCase().trim();
    if (t.includes('WIFE') || t.includes('HUSBAND') || t.includes('SPOUSE'))
      return RelationshipType.SPOUSE;
    if (t.includes('SON') || t.includes('DAUGHTER') || t.includes('CHILD'))
      return RelationshipType.CHILD;
    if (t.includes('FATHER') || t.includes('MOTHER') || t.includes('PARENT'))
      return RelationshipType.PARENT;
    if (t.includes('BROTHER') || t.includes('SISTER') || t.includes('SIBLING'))
      return RelationshipType.SIBLING;
    if (t.includes('GRAND'))
      return t.includes('CHILD') || t.includes('SON') || t.includes('DAUGHTER')
        ? RelationshipType.GRANDCHILD
        : RelationshipType.GRANDPARENT;
    return RelationshipType.OTHER;
  }
}
