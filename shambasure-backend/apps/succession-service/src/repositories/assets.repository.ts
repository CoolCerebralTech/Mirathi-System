// ============================================================================
// assets.repository.ts - Asset Data Access Layer
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { 
  Prisma, 
  PrismaService, 
  Asset, 
  AssetType,
  BeneficiaryAssignment 
} from '@shamba/database';

/**
 * AssetsRepository - Pure data access for assets
 * 
 * RESPONSIBILITIES:
 * - CRUD operations for assets
 * - Query assets by owner, type, status
 * - Include beneficiary assignments when needed
 */
@Injectable()
export class AssetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  async create(data: Prisma.AssetCreateInput): Promise<Asset> {
    return this.prisma.asset.create({ data });
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  async findById(id: string): Promise<Asset | null> {
    return this.prisma.asset.findUnique({ where: { id } });
  }

  async findByIdWithAssignments(
    id: string
  ): Promise<(Asset & { beneficiaryAssignments: BeneficiaryAssignment[] }) | null> {
    return this.prisma.asset.findUnique({
      where: { id },
      include: { beneficiaryAssignments: true },
    });
  }

  async findOneOrFail(where: Prisma.AssetWhereUniqueInput): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({ where });
    if (!asset) {
      const identifier = where.id || 'unknown';
      throw new NotFoundException(`Asset with ID '${identifier}' not found`);
    }
    return asset;
  }

  async findOneOrFailWithAssignments(
    where: Prisma.AssetWhereUniqueInput
  ): Promise<Asset & { beneficiaryAssignments: BeneficiaryAssignment[] }> {
    const asset = await this.prisma.asset.findUnique({
      where,
      include: { beneficiaryAssignments: true },
    });
    if (!asset) {
      const identifier = where.id || 'unknown';
      throw new NotFoundException(`Asset with ID '${identifier}' not found`);
    }
    return asset;
  }

  async findMany(where: Prisma.AssetWhereInput): Promise<Asset[]> {
    return this.prisma.asset.findMany({ where });
  }

  async findByOwner(ownerId: string): Promise<Asset[]> {
    return this.prisma.asset.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOwnerAndType(ownerId: string, type: AssetType): Promise<Asset[]> {
    return this.prisma.asset.findMany({
      where: { ownerId, type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.asset.count({ where: { id } });
    return count > 0;
  }

  async isOwnedBy(assetId: string, ownerId: string): Promise<boolean> {
    const count = await this.prisma.asset.count({
      where: { id: assetId, ownerId },
    });
    return count > 0;
  }

  async countByOwner(ownerId: string): Promise<number> {
    return this.prisma.asset.count({ where: { ownerId } });
  }

  // ========================================================================
  // UPDATE OPERATIONS
  // ========================================================================

  async update(id: string, data: Prisma.AssetUpdateInput): Promise<Asset> {
    return this.prisma.asset.update({
      where: { id },
      data,
    });
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  async delete(id: string): Promise<Asset> {
    // Cascading delete of assignments handled by Prisma schema
    return this.prisma.asset.delete({ where: { id } });
  }
}

