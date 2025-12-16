import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, RelationshipType } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { FamilyRelationship } from '../../../domain/entities/family-relationship.entity';
import {
  IFamilyRelationshipRepository,
  RelationshipQueryCriteria,
} from '../../../domain/interfaces/repositories/ifamily-relationship.repository';
import { FamilyRelationshipMapper } from '../mappers/family-relationship.mapper';

// This type allows us to use the regular Prisma client or a transactional client.
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class FamilyRelationshipRepository implements IFamilyRelationshipRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly relationshipMapper: FamilyRelationshipMapper,
  ) {}

  async findById(id: string): Promise<FamilyRelationship | null> {
    const relationship = await this.prisma.familyRelationship.findUnique({
      where: { id },
    });
    return this.relationshipMapper.toDomain(relationship);
  }

  async findByMembersAndType(
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
  ): Promise<FamilyRelationship | null> {
    const relationship = await this.prisma.familyRelationship.findUnique({
      where: {
        fromMemberId_toMemberId_type: { fromMemberId, toMemberId, type },
      },
    });
    return this.relationshipMapper.toDomain(relationship);
  }

  async findAllByFromMemberId(fromMemberId: string): Promise<FamilyRelationship[]> {
    return this.findAll({ fromMemberId });
  }

  async findAllByToMemberId(toMemberId: string): Promise<FamilyRelationship[]> {
    return this.findAll({ toMemberId });
  }

  async findAll(criteria: RelationshipQueryCriteria): Promise<FamilyRelationship[]> {
    const where: Prisma.FamilyRelationshipWhereInput = {};

    if (criteria.familyId) where.familyId = criteria.familyId;
    if (criteria.fromMemberId) where.fromMemberId = criteria.fromMemberId;
    if (criteria.toMemberId) where.toMemberId = criteria.toMemberId;
    if (criteria.type) where.type = criteria.type;
    if (criteria.isVerified !== undefined) where.isVerified = criteria.isVerified;
    if (criteria.isContested !== undefined) where.isContested = criteria.isContested;

    const relationships = await this.prisma.familyRelationship.findMany({ where });

    return relationships
      .map((rel) => this.relationshipMapper.toDomain(rel))
      .filter((rel): rel is FamilyRelationship => rel !== null);
  }

  async save(
    relationship: FamilyRelationship,
    tx?: TransactionClient,
  ): Promise<FamilyRelationship> {
    const prismaClient = tx || this.prisma;
    const persistenceData = this.relationshipMapper.toPersistence(relationship);

    const { id, ...updateData } = persistenceData;

    const savedRelationship = await prismaClient.familyRelationship.upsert({
      where: { id },
      create: persistenceData,
      update: updateData,
    });

    return this.relationshipMapper.toDomain(savedRelationship)!;
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;
    await prismaClient.familyRelationship.delete({
      where: { id },
    });
  }
}
