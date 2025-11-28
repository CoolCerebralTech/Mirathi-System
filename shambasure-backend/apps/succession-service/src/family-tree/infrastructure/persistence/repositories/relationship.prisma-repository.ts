import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { RelationshipType, Prisma } from '@prisma/client';
import { Relationship } from '../../../domain/entities/relationship.entity';
import { RelationshipRepositoryInterface } from '../../../domain/interfaces/relationship.repository.interface';
import { RelationshipMapper } from '../mappers/relationship.mapper';

/**
 * Prisma Implementation of the Relationship Repository
 *
 * Handles the Directed Graph edges of the family tree.
 * Implements Graph Traversal algorithms (BFS/DFS) for lineage and cycle detection.
 * Uses JSONB queries for Kenyan Succession metadata.
 */
@Injectable()
export class RelationshipPrismaRepository implements RelationshipRepositoryInterface {
  private readonly logger = new Logger(RelationshipPrismaRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(relationship: Relationship): Promise<void> {
    const data = RelationshipMapper.toPersistence(relationship);

    await this.prisma.familyRelationship.upsert({
      where: { id: relationship.getId() },
      create: {
        id: data.id,
        familyId: data.familyId,
        fromMemberId: data.fromMemberId,
        toMemberId: data.toMemberId,
        type: data.type,
        metadata: data.metadata,
        isVerified: data.isVerified,
        verificationMethod: data.verificationMethod,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        type: data.type,
        metadata: data.metadata,
        isVerified: data.isVerified,
        verificationMethod: data.verificationMethod,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Relationship | null> {
    const record = await this.prisma.familyRelationship.findUnique({
      where: { id },
    });
    return record ? RelationshipMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.familyRelationship.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------
  // GRAPH TRAVERSAL (Lineage Logic)
  // ---------------------------------------------------------

  async findByFromMemberId(memberId: string): Promise<Relationship[]> {
    // Finds outgoing edges (e.g., Parent -> Child)
    const records = await this.prisma.familyRelationship.findMany({
      where: { fromMemberId: memberId },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findByToMemberId(memberId: string): Promise<Relationship[]> {
    // Finds incoming edges (e.g., Child <- Parent)
    const records = await this.prisma.familyRelationship.findMany({
      where: { toMemberId: memberId },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findByFamilyId(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: { familyId },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findByType(memberId: string, type: RelationshipType): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        type: type,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async exists(fromId: string, toId: string, type: RelationshipType): Promise<boolean> {
    const count = await this.prisma.familyRelationship.count({
      where: {
        fromMemberId: fromId,
        toMemberId: toId,
        type: type,
      },
    });
    return count > 0;
  }

  // ---------------------------------------------------------
  // KENYAN SUCCESSION LAW SPECIFIC QUERIES
  // ---------------------------------------------------------

  async findVerifiedRelationships(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        isVerified: true,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findAdoptionRelationships(familyId: string): Promise<Relationship[]> {
    // Query JSONB metadata for { isAdopted: true }
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        metadata: {
          path: ['isAdopted'],
          equals: true,
        },
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findUnverifiedRelationships(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        isVerified: false,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findBiologicalRelationships(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        metadata: {
          path: ['isBiological'],
          equals: true,
        },
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findRelationshipsBornOutOfWedlock(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        metadata: {
          path: ['bornOutOfWedlock'],
          equals: true,
        },
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // FAMILY TREE ANALYSIS
  // ---------------------------------------------------------

  async findAncestralLineage(memberId: string, generations: number): Promise<Relationship[]> {
    // Iterative approach to fetch upwards (Parents -> Grandparents)
    const lineage: Relationship[] = [];
    let currentGenerationIds = [memberId];

    for (let i = 0; i < generations; i++) {
      if (currentGenerationIds.length === 0) break;

      // Find parents of current generation
      const parentEdges = await this.prisma.familyRelationship.findMany({
        where: {
          toMemberId: { in: currentGenerationIds },
          type: RelationshipType.PARENT, // Assuming Parent -> Child direction
        },
      });

      if (parentEdges.length === 0) break;

      const mappedEdges = parentEdges.map((r) => RelationshipMapper.toDomain(r));
      lineage.push(...mappedEdges);

      // Prepare next iteration
      currentGenerationIds = mappedEdges.map((r) => r.getFromMemberId());
    }

    return lineage;
  }

  async findDescendants(memberId: string, includeAdopted: boolean = true): Promise<Relationship[]> {
    // Recursive fetch downwards (Parent -> Children) using BFS
    // We fetch ALL relationships for the family first to avoid N+1 DB calls if family is small enough
    // Otherwise, we do iterative DB calls. Here, assuming iterative for safety.
    const descendants: Relationship[] = [];
    let currentIds = [memberId];
    const visited = new Set<string>();

    while (currentIds.length > 0) {
      // Find children of current batch
      const childEdges = await this.prisma.familyRelationship.findMany({
        where: {
          fromMemberId: { in: currentIds },
          type: RelationshipType.PARENT,
        },
      });

      if (childEdges.length === 0) break;

      // Filter adopted if necessary (in memory filter for complex JSON logic)
      const validEdges = childEdges.filter((edge) => {
        if (includeAdopted) return true;
        // If includeAdopted is false, exclude edges where metadata.isAdopted is true
        const meta = edge.metadata as any;
        return !meta?.isAdopted;
      });

      const mapped = validEdges.map((r) => RelationshipMapper.toDomain(r));
      descendants.push(...mapped);

      // Prepare next layer, preventing cycles
      const nextIds: string[] = [];
      for (const edge of mapped) {
        if (!visited.has(edge.getToMemberId())) {
          visited.add(edge.getToMemberId());
          nextIds.push(edge.getToMemberId());
        }
      }
      currentIds = nextIds;
    }

    return descendants;
  }

  async findSiblings(memberId: string): Promise<Relationship[]> {
    // Logic: My siblings are the children of my parents (excluding me)

    // 1. Find my parents (Incoming PARENT edges)
    const parentEdges = await this.prisma.familyRelationship.findMany({
      where: {
        toMemberId: memberId,
        type: RelationshipType.PARENT,
      },
      select: { fromMemberId: true },
    });

    const parentIds = parentEdges.map((p) => p.fromMemberId);

    if (parentIds.length === 0) return [];

    // 2. Find all children of these parents
    const siblingEdges = await this.prisma.familyRelationship.findMany({
      where: {
        fromMemberId: { in: parentIds },
        type: RelationshipType.PARENT,
        toMemberId: { not: memberId }, // Exclude self
      },
    });

    // NOTE: This returns Parent->Sibling edges.
    // If the domain needs Sibling<->Sibling edges, those usually don't exist explicitly in this graph model
    // (they are inferred). The interface return type implies returning Relationship entities.
    // We return the edges establishing the siblinghood (Parent->Sibling).
    return siblingEdges.map((r) => RelationshipMapper.toDomain(r));
  }

  async findSpouseRelationships(memberId: string): Promise<Relationship[]> {
    // Explicit SPOUSE relationships
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        type: RelationshipType.SPOUSE,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // VALIDATION & INTEGRITY
  // ---------------------------------------------------------

  async detectCircularRelationships(
    familyId: string,
  ): Promise<{ hasCircular: boolean; details?: string }> {
    // 1. Fetch all directional edges for the family (Lightweight query)
    const edges = await this.prisma.familyRelationship.findMany({
      where: { familyId, type: { in: [RelationshipType.PARENT, RelationshipType.CHILD] } },
      select: { fromMemberId: true, toMemberId: true },
    });

    // 2. Build Adjacency List
    const graph = new Map<string, string[]>();
    for (const edge of edges) {
      if (!graph.has(edge.fromMemberId)) graph.set(edge.fromMemberId, []);
      graph.get(edge.fromMemberId)?.push(edge.toMemberId);
    }

    // 3. DFS Cycle Detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true; // Cycle found
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        if (hasCycle(node)) {
          return { hasCircular: true, details: `Cycle detected involving member ${node}` };
        }
      }
    }

    return { hasCircular: false };
  }

  async validateTreeIntegrity(familyId: string): Promise<{
    isValid: boolean;
    issues: string[];
    orphanedMembers: string[];
  }> {
    const issues: string[] = [];

    // 1. Check Cycles
    const cycleCheck = await this.detectCircularRelationships(familyId);
    if (cycleCheck.hasCircular) {
      issues.push(cycleCheck.details || 'Circular relationships detected');
    }

    // 2. Check Orphans (Members with no edges)
    // Fetch all member IDs
    const members = await this.prisma.familyMember.findMany({
      where: { familyId, deletedAt: null },
      select: { id: true },
    });
    const memberIds = new Set(members.map((m) => m.id));

    // Fetch all edges
    const edges = await this.prisma.familyRelationship.findMany({
      where: { familyId },
      select: { fromMemberId: true, toMemberId: true },
    });

    const connectedMembers = new Set<string>();
    edges.forEach((e) => {
      connectedMembers.add(e.fromMemberId);
      connectedMembers.add(e.toMemberId);
    });

    const orphanedMembers: string[] = [];
    memberIds.forEach((id) => {
      if (!connectedMembers.has(id)) {
        // Only count as orphan if member count > 1 (single member family is valid start)
        if (memberIds.size > 1) orphanedMembers.push(id);
      }
    });

    if (orphanedMembers.length > 0) {
      issues.push(`${orphanedMembers.length} orphaned members found (disconnected from tree)`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      orphanedMembers,
    };
  }

  // ---------------------------------------------------------
  // BULK OPERATIONS
  // ---------------------------------------------------------

  async saveMany(relationships: Relationship[]): Promise<void> {
    const transactions = relationships.map((rel) => {
      const data = RelationshipMapper.toPersistence(rel);
      return this.prisma.familyRelationship.upsert({
        where: { id: data.id },
        create: data as Prisma.FamilyRelationshipUncheckedCreateInput,
        update: data as Prisma.FamilyRelationshipUncheckedUpdateInput,
      });
    });

    await this.prisma.$transaction(transactions);
  }

  async deleteByMember(memberId: string): Promise<void> {
    await this.prisma.familyRelationship.deleteMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
      },
    });
  }

  async bulkVerify(relationshipIds: string[], method: string, verifiedBy: string): Promise<void> {
    await this.prisma.familyRelationship.updateMany({
      where: { id: { in: relationshipIds } },
      data: {
        isVerified: true,
        verificationMethod: method,
        updatedAt: new Date(),
        // Note: verifiedBy/verifiedAt are not in standard schema yet,
        // assumed to be handled by application log or metadata update if needed
      },
    });
  }
}
