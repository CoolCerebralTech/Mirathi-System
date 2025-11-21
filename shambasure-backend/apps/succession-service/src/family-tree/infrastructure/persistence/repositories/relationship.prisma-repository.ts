// succession-service/src/family-tree/infrastructure/persistence/repositories/relationship.prisma-repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { RelationshipType } from '@prisma/client';
import { RelationshipRepositoryInterface } from '../../../domain/interfaces/relationship.repository.interface';
import { Relationship } from '../../../domain/entities/relationship.entity';
import { RelationshipMapper } from '../mappers/relationship.mapper';

@Injectable()
export class RelationshipPrismaRepository implements RelationshipRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  async save(relationship: Relationship): Promise<void> {
    const persistenceModel = RelationshipMapper.toPersistence(relationship);

    await this.prisma.familyRelationship.upsert({
      where: { id: persistenceModel.id },
      create: persistenceModel,
      update: persistenceModel,
    });
  }

  async findById(id: string): Promise<Relationship | null> {
    const raw = await this.prisma.familyRelationship.findUnique({
      where: { id },
    });
    return raw ? RelationshipMapper.toDomain(raw) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.familyRelationship.delete({
      where: { id },
    });
  }

  // --------------------------------------------------------------------------
  // GRAPH TRAVERSAL
  // --------------------------------------------------------------------------

  async findByFromMemberId(memberId: string): Promise<Relationship[]> {
    const raw = await this.prisma.familyRelationship.findMany({
      where: { fromMemberId: memberId },
    });
    return raw.map(RelationshipMapper.toDomain);
  }

  async findByToMemberId(memberId: string): Promise<Relationship[]> {
    const raw = await this.prisma.familyRelationship.findMany({
      where: { toMemberId: memberId },
    });
    return raw.map(RelationshipMapper.toDomain);
  }

  async findByFamilyId(familyId: string): Promise<Relationship[]> {
    const raw = await this.prisma.familyRelationship.findMany({
      where: { familyId },
    });
    return raw.map(RelationshipMapper.toDomain);
  }

  async findByType(memberId: string, type: RelationshipType): Promise<Relationship[]> {
    // Assuming we want Outgoing relationships of a type (e.g., "My Children")
    // If context requires incoming (e.g. "My Parents"), logic must adapt or use From/To methods directly.
    // This method assumes strict "from" direction based on Entity logic.
    const raw = await this.prisma.familyRelationship.findMany({
      where: { fromMemberId: memberId, type },
    });
    return raw.map(RelationshipMapper.toDomain);
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
}