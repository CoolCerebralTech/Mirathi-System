import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService, Asset } from '@shamba/database';

@Injectable()
export class AssetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AssetCreateInput): Promise<Asset> {
    return this.prisma.asset.create({ data });
  }

  async findOneOrFail(where: Prisma.AssetWhereUniqueInput): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({ where });
    if (!asset) {
      throw new NotFoundException('Asset not found.');
    }
    return asset;
  }
  
  async findMany(where: Prisma.AssetWhereInput): Promise<Asset[]> {
      return this.prisma.asset.findMany({ where });
  }

  async update(id: string, data: Prisma.AssetUpdateInput): Promise<Asset> {
    return this.prisma.asset.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Asset> {
    return this.prisma.asset.delete({ where: { id } });
  }
}