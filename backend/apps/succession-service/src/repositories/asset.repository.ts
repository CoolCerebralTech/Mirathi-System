import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { AssetEntity } from '../entities/will.entity';
import { CreateAssetDto, UpdateAssetDto, AssetType } from '@shamba/common';

@Injectable()
export class AssetRepository {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, createAssetDto: CreateAssetDto): Promise<AssetEntity> {
    const asset = await this.prisma.asset.create({
      data: {
        ...createAssetDto,
        ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        beneficiaryAssignments: {
          include: {
            will: true,
            beneficiary: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return new AssetEntity(asset);
  }

  async findById(id: string): Promise<AssetEntity> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        beneficiaryAssignments: {
          include: {
            will: true,
            beneficiary: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return new AssetEntity(asset);
  }

  async findByOwnerId(ownerId: string): Promise<AssetEntity[]> {
    const assets = await this.prisma.asset.findMany({
      where: { ownerId },
      include: {
        beneficiaryAssignments: {
          include: {
            will: true,
            beneficiary: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assets.map(asset => new AssetEntity(asset));
  }

  async update(id: string, updateAssetDto: UpdateAssetDto): Promise<AssetEntity> {
    await this.findById(id); // Verify asset exists

    const asset = await this.prisma.asset.update({
      where: { id },
      data: updateAssetDto,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        beneficiaryAssignments: {
          include: {
            will: true,
            beneficiary: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return new AssetEntity(asset);
  }

  async delete(id: string): Promise<void> {
    const asset = await this.findById(id);

    // Check if asset has beneficiary assignments
    if (asset.beneficiaryAssignments && asset.beneficiaryAssignments.length > 0) {
      throw new ConflictException('Cannot delete asset with existing beneficiary assignments');
    }

    await this.prisma.asset.delete({
      where: { id },
    });
  }

  async getAssetsByType(ownerId: string, type: AssetType): Promise<AssetEntity[]> {
    const assets = await this.prisma.asset.findMany({
      where: { ownerId, type },
      include: {
        beneficiaryAssignments: {
          include: {
            will: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
            beneficiary: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return assets.map(asset => new AssetEntity(asset));
  }

  async searchAssets(ownerId: string, query: string): Promise<AssetEntity[]> {
    const assets = await this.prisma.asset.findMany({
      where: {
        ownerId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        beneficiaryAssignments: {
          include: {
            will: true,
            beneficiary: true,
          },
        },
      },
    });

    return assets.map(asset => new AssetEntity(asset));
  }

  async getAssetStats(ownerId: string): Promise<{
    totalAssets: number;
    assetsByType: Record<string, number>;
    assignedAssets: number;
    unassignedAssets: number;
    totalEstimatedValue: number;
  }> {
    const assets = await this.findByOwnerId(ownerId);
    
    const totalAssets = assets.length;
    const assignedAssets = assets.filter(a => a.beneficiaryAssignments && a.beneficiaryAssignments.length > 0).length;
    const unassignedAssets = totalAssets - assignedAssets;

    const assetsByType: Record<string, number> = {};
    let totalEstimatedValue = 0;

    assets.forEach(asset => {
      // Count by type
      assetsByType[asset.type] = (assetsByType[asset.type] || 0) + 1;

      // Sum estimated values
      const value = asset.getEstimatedValue();
      if (value !== null) {
        totalEstimatedValue += value;
      }
    });

    return {
      totalAssets,
      assetsByType,
      assignedAssets,
      unassignedAssets,
      totalEstimatedValue,
    };
  }
}